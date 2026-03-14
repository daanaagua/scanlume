import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import {
  isAuthEmailConfigured,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "./mailer";
import { readNumber, sha256Hex, type WorkerEnv } from "./store";

const SESSION_COOKIE_NAME = "scanlume_session";
const OAUTH_STATE_COOKIE_NAME = "scanlume_google_state";
const OAUTH_REDIRECT_COOKIE_NAME = "scanlume_post_auth_redirect";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const OAUTH_STATE_TTL_SECONDS = 60 * 10;
const PASSWORD_HASH_PREFIX = "pbkdf2_sha256";
// Cloudflare Workers Web Crypto caps PBKDF2 iterations at 100k.
const PASSWORD_HASH_ITERATIONS = 100_000;
const PASSWORD_HASH_BYTES = 32;
const PASSWORD_MIN_LENGTH = 8;
const VERIFY_EMAIL_TOKEN_TTL_SECONDS = 60 * 60 * 24;
const RESET_PASSWORD_TOKEN_TTL_SECONDS = 60 * 60;

type AppContext = Context<{ Bindings: WorkerEnv }>;

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
};

type GoogleUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

type GoogleResolvedUserInfo = GoogleUserInfo & {
  email: string;
};

export type SessionViewer = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  hasPassword: boolean;
  authProviders: string[];
};

export function getWebOrigin(env: WorkerEnv) {
  return env.WEB_ORIGIN ?? "https://www.scanlume.com";
}

export function getGoogleRedirectUri(env: WorkerEnv, requestOrigin: string) {
  return env.GOOGLE_REDIRECT_URI ?? `${requestOrigin}/v1/auth/google/callback`;
}

export function getLoggedInDailyImageLimit(env: WorkerEnv) {
  return readNumber(env.LOGGED_IN_DAILY_IMAGE_LIMIT, 100);
}

export function getLoggedInDailyCreditLimit(env: WorkerEnv) {
  return readNumber(env.LOGGED_IN_DAILY_CREDIT_LIMIT, 100);
}

export function isGoogleAuthConfigured(env: WorkerEnv) {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function setOauthState(c: AppContext, env: WorkerEnv, state: string, redirectTo: string) {
  const cookieOptions = buildCookieOptions(c, env, OAUTH_STATE_TTL_SECONDS);
  setCookie(c, OAUTH_STATE_COOKIE_NAME, state, cookieOptions);
  setCookie(c, OAUTH_REDIRECT_COOKIE_NAME, redirectTo, cookieOptions);
}

export function readOauthState(c: AppContext) {
  return {
    state: getCookie(c, OAUTH_STATE_COOKIE_NAME),
    redirectTo: sanitizeRedirectPath(getCookie(c, OAUTH_REDIRECT_COOKIE_NAME)),
  };
}

export function clearOauthState(c: AppContext, env: WorkerEnv) {
  const cookieOptions = buildCookieOptions(c, env, 0);
  deleteCookie(c, OAUTH_STATE_COOKIE_NAME, cookieOptions);
  deleteCookie(c, OAUTH_REDIRECT_COOKIE_NAME, cookieOptions);
}

export async function createUserSession(c: AppContext, env: WorkerEnv, userId: string) {
  if (!env.DB) {
    throw new Error("D1 binding is required for user sessions.");
  }

  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString();
  const createdAt = now.toISOString();

  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
  )
    .bind(crypto.randomUUID(), userId, tokenHash, expiresAt, createdAt, createdAt)
    .run();

  setCookie(c, SESSION_COOKIE_NAME, token, buildCookieOptions(c, env, SESSION_TTL_SECONDS));
}

export async function destroyUserSession(c: AppContext, env: WorkerEnv) {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (token && env.DB) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?;`).bind(tokenHash).run();
  }

  deleteCookie(c, SESSION_COOKIE_NAME, buildCookieOptions(c, env, 0));
}

export async function getSessionViewer(
  c: AppContext,
  env: WorkerEnv,
  options: { allowUnverified?: boolean } = {},
) {
  if (!env.DB) {
    return null;
  }

  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (!token) {
    return null;
  }

  const tokenHash = await sha256Hex(token);
  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    `SELECT users.id
     FROM sessions
     INNER JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > ?
     LIMIT 1;`,
  )
    .bind(tokenHash, now)
    .first<{ id: string }>();

  if (!row) {
    deleteCookie(c, SESSION_COOKIE_NAME, buildCookieOptions(c, env, 0));
    return null;
  }

  const viewer = await readViewerById(env, row.id);
  if (!options.allowUnverified && viewer.hasPassword && !viewer.emailVerified) {
    return null;
  }

  return viewer;
}

export async function registerPasswordViewer(
  env: WorkerEnv,
  input: { name: string; email: string; password: string },
) {
  if (!env.DB) {
    throw new Error("D1 binding is required for user accounts.");
  }

  validatePassword(input.password);

  const email = normalizeEmail(input.email);
  const name = normalizeName(input.name, email);
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.password);
  const existingUser = await env.DB.prepare(
    `SELECT id, email, name, avatar_url FROM users WHERE email = ? LIMIT 1;`,
  )
    .bind(email)
    .first<{ id: string; email: string; name: string; avatar_url: string | null }>();

  const userId = existingUser?.id ?? crypto.randomUUID();

  if (existingUser) {
    const existingPassword = await env.DB.prepare(
      `SELECT user_id FROM password_credentials WHERE user_id = ? LIMIT 1;`,
    )
      .bind(existingUser.id)
      .first<{ user_id: string }>();

    if (existingPassword) {
      throw new Error("email_already_registered");
    }

    await env.DB.prepare(
      `UPDATE users
       SET email = ?, name = ?, updated_at = ?
       WHERE id = ?;`,
    )
      .bind(email, resolveRegisteredName(existingUser, name), now, existingUser.id)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO users (id, email, name, avatar_url, email_verified_at, created_at, updated_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    )
      .bind(userId, email, name, null, null, now, now, now)
      .run();
  }

  await env.DB.prepare(
    `INSERT INTO password_credentials (user_id, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       password_hash = excluded.password_hash,
       updated_at = excluded.updated_at;`,
  )
    .bind(userId, passwordHash, now, now)
    .run();

  return readViewerById(env, userId);
}

export async function authenticatePasswordViewer(env: WorkerEnv, email: string, password: string) {
  if (!env.DB) {
    throw new Error("D1 binding is required for user accounts.");
  }

  const normalizedEmail = normalizeEmail(email);
  const row = await env.DB.prepare(
    `SELECT users.id, password_credentials.password_hash
     FROM users
     INNER JOIN password_credentials ON password_credentials.user_id = users.id
     WHERE users.email = ?
     LIMIT 1;`,
  )
    .bind(normalizedEmail)
    .first<{ id: string; password_hash: string }>();

  if (!row || !(await verifyPassword(password, row.password_hash))) {
    throw new Error("invalid_credentials");
  }

  await env.DB.prepare(
    `UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?;`,
  )
    .bind(new Date().toISOString(), new Date().toISOString(), row.id)
    .run();

  const viewer = await readViewerById(env, row.id);
  if (!viewer.emailVerified) {
    throw new Error("email_not_verified");
  }

  return viewer;
}

export async function requestEmailVerification(env: WorkerEnv, user: SessionViewer) {
  const token = await issueAuthToken(env, {
    userId: user.id,
    email: user.email,
    purpose: "verify_email",
    ttlSeconds: VERIFY_EMAIL_TOKEN_TTL_SECONDS,
  });

  if (!isAuthEmailConfigured(env)) {
    return {
      emailDeliveryConfigured: false,
      emailSent: false,
    };
  }

  await sendVerificationEmail(env, {
    email: user.email,
    name: user.name,
    token,
  });

  return {
    emailDeliveryConfigured: true,
    emailSent: true,
  };
}

export async function requestPasswordReset(env: WorkerEnv, email: string) {
  if (!env.DB) {
    throw new Error("D1 binding is required for user accounts.");
  }

  const normalizedEmail = normalizeEmail(email);
  const row = await env.DB.prepare(
    `SELECT id, email, name FROM users WHERE email = ? LIMIT 1;`,
  )
    .bind(normalizedEmail)
    .first<{ id: string; email: string; name: string }>();

  if (!row) {
    return {
      emailDeliveryConfigured: isAuthEmailConfigured(env),
      emailSent: false,
    };
  }

  const token = await issueAuthToken(env, {
    userId: row.id,
    email: row.email,
    purpose: "reset_password",
    ttlSeconds: RESET_PASSWORD_TOKEN_TTL_SECONDS,
  });

  if (!isAuthEmailConfigured(env)) {
    return {
      emailDeliveryConfigured: false,
      emailSent: false,
    };
  }

  await sendPasswordResetEmail(env, {
    email: row.email,
    name: row.name,
    token,
  });

  return {
    emailDeliveryConfigured: true,
    emailSent: true,
  };
}

export async function verifyEmailToken(env: WorkerEnv, token: string) {
  if (!env.DB) {
    throw new Error("D1 binding is required for user accounts.");
  }

  const record = await consumeAuthToken(env, token, "verify_email");
  const now = new Date().toISOString();

  await env.DB.prepare(
    `UPDATE users
     SET email_verified_at = COALESCE(email_verified_at, ?), updated_at = ?
     WHERE id = ?;`,
  )
    .bind(now, now, record.userId)
    .run();

  return readViewerById(env, record.userId);
}

export async function resetPasswordWithToken(env: WorkerEnv, token: string, password: string) {
  if (!env.DB) {
    throw new Error("D1 binding is required for user accounts.");
  }

  validatePassword(password);
  const record = await consumeAuthToken(env, token, "reset_password");
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);

  await env.DB.prepare(
    `INSERT INTO password_credentials (user_id, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       password_hash = excluded.password_hash,
       updated_at = excluded.updated_at;`,
  )
    .bind(record.userId, passwordHash, now, now)
    .run();

  await env.DB.prepare(
    `UPDATE users
     SET email_verified_at = COALESCE(email_verified_at, ?), updated_at = ?, last_login_at = ?
     WHERE id = ?;`,
  )
    .bind(now, now, now, record.userId)
    .run();

  return readViewerById(env, record.userId);
}

export async function exchangeGoogleCode(
  env: WorkerEnv,
  code: string,
  redirectUri: string,
) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth is not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as GoogleTokenResponse;
  if (!payload.access_token) {
    throw new Error("Google did not return an access token.");
  }

  return payload.access_token;
}

export async function fetchGoogleUser(accessToken: string): Promise<GoogleResolvedUserInfo> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as GoogleUserInfo;
  if (!payload.sub || !payload.email) {
    throw new Error("Google account data is incomplete.");
  }

  return {
    ...payload,
    email: payload.email,
  };
}

export async function upsertGoogleViewer(env: WorkerEnv, profile: GoogleResolvedUserInfo) {
  if (!env.DB) {
    throw new Error("D1 binding is required for user accounts.");
  }

  const now = new Date().toISOString();
  const provider = "google";
  const email = normalizeEmail(profile.email);
  const verifiedAt = profile.email_verified ? now : null;
  const existingOauth = await env.DB.prepare(
    `SELECT users.id, users.email, users.name, users.avatar_url
     FROM oauth_accounts
     INNER JOIN users ON users.id = oauth_accounts.user_id
     WHERE oauth_accounts.provider = ? AND oauth_accounts.provider_user_id = ?
     LIMIT 1;`,
  )
    .bind(provider, profile.sub)
    .first<{ id: string; email: string; name: string; avatar_url: string | null }>();

  let userId = existingOauth?.id;

  if (!userId) {
    const existingUser = await env.DB.prepare(
      `SELECT id FROM users WHERE email = ? LIMIT 1;`,
    )
      .bind(email)
      .first<{ id: string }>();

    userId = existingUser?.id ?? crypto.randomUUID();

    if (existingUser) {
      await env.DB.prepare(
       `UPDATE users
         SET email = ?, name = ?, avatar_url = ?, email_verified_at = COALESCE(?, email_verified_at), updated_at = ?, last_login_at = ?
         WHERE id = ?;`,
      )
        .bind(email, profile.name ?? email, profile.picture ?? null, verifiedAt, now, now, userId)
        .run();
    } else {
      await env.DB.prepare(
        `INSERT INTO users (id, email, name, avatar_url, email_verified_at, created_at, updated_at, last_login_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      )
        .bind(
          userId,
          email,
          profile.name ?? email,
          profile.picture ?? null,
          verifiedAt,
          now,
          now,
          now,
        )
        .run();
    }

    await env.DB.prepare(
      `INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(provider, provider_user_id) DO UPDATE SET
         user_id = excluded.user_id,
         updated_at = excluded.updated_at;`,
    )
      .bind(crypto.randomUUID(), userId, provider, profile.sub, now, now)
      .run();
  } else {
    await env.DB.prepare(
       `UPDATE users
        SET email = ?, name = ?, avatar_url = ?, email_verified_at = COALESCE(?, email_verified_at), updated_at = ?, last_login_at = ?
        WHERE id = ?;`,
    )
      .bind(email, profile.name ?? email, profile.picture ?? null, verifiedAt, now, now, userId)
      .run();
  }

  return readViewerById(env, userId);
}

export function sanitizeRedirectPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/imagem-para-texto";
  }

  return value;
}

export function buildGoogleAuthorizationUrl(env: WorkerEnv, requestOrigin: string, state: string) {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error("Google OAuth is not configured.");
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", getGoogleRedirectUri(env, requestOrigin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", state);
  return url.toString();
}

export function randomToken(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return base64Url(bytes);
}

function buildCookieOptions(c: AppContext, env: WorkerEnv, maxAge: number) {
  const requestUrl = new URL(c.req.url);
  const isLocalhost = ["localhost", "127.0.0.1"].includes(requestUrl.hostname);
  const sameSite: "None" | "Lax" = !isLocalhost && requestUrl.protocol === "https:" ? "None" : "Lax";

  return {
    httpOnly: true,
    maxAge,
    path: "/",
    secure: !isLocalhost && requestUrl.protocol === "https:",
    sameSite,
    domain: isLocalhost ? undefined : env.COOKIE_DOMAIN ?? ".scanlume.com",
  };
}

async function issueAuthToken(
  env: WorkerEnv,
  input: {
    userId: string;
    email: string;
    purpose: "verify_email" | "reset_password";
    ttlSeconds: number;
  },
) {
  if (!env.DB) {
    throw new Error("D1 binding is required for user accounts.");
  }

  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + input.ttlSeconds * 1000).toISOString();

  await env.DB.prepare(
    `DELETE FROM auth_tokens WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL;`,
  )
    .bind(input.userId, input.purpose)
    .run();

  await env.DB.prepare(
    `INSERT INTO auth_tokens (id, user_id, purpose, email, token_hash, expires_at, consumed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?);`,
  )
    .bind(crypto.randomUUID(), input.userId, input.purpose, input.email, tokenHash, expiresAt, createdAt)
    .run();

  return token;
}

async function consumeAuthToken(
  env: WorkerEnv,
  token: string,
  purpose: "verify_email" | "reset_password",
) {
  if (!env.DB) {
    throw new Error("D1 binding is required for user accounts.");
  }

  const tokenHash = await sha256Hex(token);
  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    `SELECT id, user_id, email
     FROM auth_tokens
     WHERE token_hash = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ?
     LIMIT 1;`,
  )
    .bind(tokenHash, purpose, now)
    .first<{ id: string; user_id: string; email: string }>();

  if (!row) {
    throw new Error("token_invalid_or_expired");
  }

  await env.DB.prepare(
    `UPDATE auth_tokens SET consumed_at = ? WHERE id = ?;`,
  )
    .bind(now, row.id)
    .run();

  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
  };
}

async function readViewerById(env: WorkerEnv, userId: string) {
  if (!env.DB) {
    throw new Error("D1 binding is required for user accounts.");
  }

  const row = await env.DB.prepare(
    `SELECT id, email, name, avatar_url, email_verified_at FROM users WHERE id = ? LIMIT 1;`,
  )
    .bind(userId)
    .first<{ id: string; email: string; name: string; avatar_url: string | null; email_verified_at: string | null }>();

  if (!row) {
    throw new Error("user_not_found");
  }

  const authState = await readUserAuthState(env, userId);

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    emailVerified: Boolean(row.email_verified_at),
    emailVerifiedAt: row.email_verified_at,
    hasPassword: authState.hasPassword,
    authProviders: authState.providers,
  } satisfies SessionViewer;
}

async function readUserAuthState(env: WorkerEnv, userId: string) {
  if (!env.DB) {
    throw new Error("D1 binding is required for user accounts.");
  }

  const passwordRow = await env.DB.prepare(
    `SELECT user_id FROM password_credentials WHERE user_id = ? LIMIT 1;`,
  )
    .bind(userId)
    .first<{ user_id: string }>();

  const providerRows = await env.DB.prepare(
    `SELECT provider FROM oauth_accounts WHERE user_id = ? ORDER BY provider ASC;`,
  )
    .bind(userId)
    .all<{ provider: string }>();

  return {
    hasPassword: Boolean(passwordRow),
    providers: (providerRows.results ?? []).map((row) => row.provider),
  };
}

function resolveRegisteredName(
  existingUser: { name: string; email: string },
  fallbackName: string,
) {
  const currentName = existingUser.name.trim();
  if (!currentName || currentName === existingUser.email) {
    return fallbackName;
  }

  return currentName;
}

function normalizeName(name: string, fallbackEmail: string) {
  const normalized = name.trim().replace(/\s+/g, " ");
  return normalized || fallbackEmail;
}

function validatePassword(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new Error("password_too_short");
  }
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await derivePasswordBytes(password, salt, PASSWORD_HASH_ITERATIONS);
  return `${PASSWORD_HASH_PREFIX}$${PASSWORD_HASH_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(derived)}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [prefix, iterationValue, saltHex, hashHex] = storedHash.split("$");
  const iterations = Number(iterationValue);

  if (
    prefix !== PASSWORD_HASH_PREFIX ||
    !Number.isFinite(iterations) ||
    !saltHex ||
    !hashHex
  ) {
    return false;
  }

  const salt = hexToBytes(saltHex);
  const expected = hexToBytes(hashHex);
  const actual = await derivePasswordBytes(password, salt, iterations);
  return constantTimeEquals(actual, expected);
}

async function derivePasswordBytes(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new Uint8Array(salt),
      iterations,
    },
    key,
    PASSWORD_HASH_BYTES * 8,
  );
  return new Uint8Array(bits);
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

function constantTimeEquals(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index];
  }
  return mismatch === 0;
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
