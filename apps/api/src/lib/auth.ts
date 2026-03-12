import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import { readNumber, sha256Hex, type WorkerEnv } from "./store";

const SESSION_COOKIE_NAME = "scanlume_session";
const OAUTH_STATE_COOKIE_NAME = "scanlume_google_state";
const OAUTH_REDIRECT_COOKIE_NAME = "scanlume_post_auth_redirect";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const OAUTH_STATE_TTL_SECONDS = 60 * 10;

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

export async function getSessionViewer(c: AppContext, env: WorkerEnv) {
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
    `SELECT users.id, users.email, users.name, users.avatar_url
     FROM sessions
     INNER JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > ?
     LIMIT 1;`,
  )
    .bind(tokenHash, now)
    .first<{ id: string; email: string; name: string; avatar_url: string | null }>();

  if (!row) {
    deleteCookie(c, SESSION_COOKIE_NAME, buildCookieOptions(c, env, 0));
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
  } satisfies SessionViewer;
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
      .bind(profile.email)
      .first<{ id: string }>();

    userId = existingUser?.id ?? crypto.randomUUID();

    if (existingUser) {
      await env.DB.prepare(
        `UPDATE users
         SET email = ?, name = ?, avatar_url = ?, updated_at = ?, last_login_at = ?
         WHERE id = ?;`,
      )
        .bind(profile.email, profile.name ?? profile.email, profile.picture ?? null, now, now, userId)
        .run();
    } else {
      await env.DB.prepare(
        `INSERT INTO users (id, email, name, avatar_url, created_at, updated_at, last_login_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
      )
        .bind(
          userId,
          profile.email,
          profile.name ?? profile.email,
          profile.picture ?? null,
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
       SET email = ?, name = ?, avatar_url = ?, updated_at = ?, last_login_at = ?
       WHERE id = ?;`,
    )
      .bind(profile.email, profile.name ?? profile.email, profile.picture ?? null, now, now, userId)
      .run();
  }

  return {
    id: userId,
    email: profile.email,
    name: profile.name ?? profile.email,
    avatarUrl: profile.picture ?? null,
  } satisfies SessionViewer;
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

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
