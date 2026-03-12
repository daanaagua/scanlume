"use client";

import { useEffect, useMemo, useState } from "react";

import { API_BASE_URL } from "@/lib/site";

type AuthResponse = {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  } | null;
};

export function AuthControls() {
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    void fetch(`${API_BASE_URL}/v1/me`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data: AuthResponse) => setAuth(data))
      .catch(() => setAuth({ authenticated: false }));
  }, []);

  const initials = useMemo(() => {
    const name = auth?.user?.name?.trim();
    if (!name) {
      return "S";
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "S";
  }, [auth?.user?.name]);

  function handleGoogleLogin() {
    const redirectTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.href = `${API_BASE_URL}/v1/auth/google/start?redirectTo=${encodeURIComponent(redirectTo)}`;
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch(`${API_BASE_URL}/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      window.location.reload();
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (!auth?.authenticated || !auth.user) {
    return (
      <button type="button" className="ghost-button auth-login-button" onClick={handleGoogleLogin}>
        Entrar com Google
      </button>
    );
  }

  return (
    <div className="auth-controls">
      <div className="auth-chip" title={auth.user.email}>
        {auth.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={auth.user.avatarUrl} alt={auth.user.name} className="auth-avatar-image" />
        ) : (
          <span className="auth-avatar-fallback">{initials}</span>
        )}
        <span>
          <strong>{auth.user.name}</strong>
          <small>100 creditos por dia</small>
        </span>
      </div>
      <button type="button" className="ghost-button auth-logout-button" onClick={() => void handleLogout()} disabled={isLoggingOut}>
        {isLoggingOut ? "Saindo..." : "Sair"}
      </button>
    </div>
  );
}
