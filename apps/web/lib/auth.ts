import { API_BASE_URL } from "@/lib/site";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

export type AuthResult = {
  ok: true;
  viewer: {
    authenticated: true;
    user: AuthUser;
  };
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

async function postAuthRequest(path: string, payload: Record<string, string>) {
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

  return (await response.json()) as AuthResult;
}
