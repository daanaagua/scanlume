import { API_BASE_URL } from "@/lib/site";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  hasPassword: boolean;
  authProviders: string[];
};

export type AuthResult = {
  ok: true;
  viewer: {
    authenticated: true;
    user: AuthUser;
  };
};

export type AuthActionResult = {
  ok: true;
  message?: string;
  emailDeliveryConfigured?: boolean;
  emailSent?: boolean;
  alreadyVerified?: boolean;
  user?: AuthUser;
};

type AuthPayload = {
  error?: string;
};

export function startGoogleLogin(redirectTo?: string) {
  const target = redirectTo ?? `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.href = `${API_BASE_URL}/v1/auth/google/start?redirectTo=${encodeURIComponent(target)}`;
}

export async function loginWithPassword(input: { email: string; password: string }) {
  return postAuthRequest("/v1/auth/login", input);
}

export async function registerWithPassword(input: { name: string; email: string; password: string }) {
  return postAuthRequest("/v1/auth/register", input);
}

export async function requestPasswordReset(input: { email: string }) {
  return postAuthRequest<AuthActionResult>("/v1/auth/forgot-password", input);
}

export async function resetPassword(input: { token: string; password: string }) {
  return postAuthRequest<AuthResult>("/v1/auth/reset-password", input);
}

export async function verifyEmail(input: { token: string }) {
  return postAuthRequest<AuthActionResult>("/v1/auth/verify-email", input);
}

export async function resendVerificationEmail() {
  return postAuthRequest<AuthActionResult>("/v1/auth/resend-verification", {});
}

async function postAuthRequest<T>(path: string, payload: Record<string, string>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as AuthPayload | null;
    throw new Error(data?.error ?? "Nao foi possivel autenticar agora.");
  }

  return (await response.json()) as T;
}
