"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { getOrCreateBrowserId } from "@/lib/browser-id";
import { fetchAccount, type AccountResponse } from "@/lib/account";
import { API_BASE_URL } from "@/lib/site";

export function AuthControls() {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const browserId = getOrCreateBrowserId();
    void fetchAccount(browserId)
      .then((data) => setAccount(data))
      .catch(() => setAccount(null));
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isMenuOpen]);

  const initials = useMemo(() => {
    const name = account?.viewer.user?.name?.trim();
    if (!name) {
      return "S";
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "S";
  }, [account?.viewer.user?.name]);

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

  if (!account?.viewer.authenticated || !account.viewer.user) {
    return (
      <button type="button" className="ghost-button auth-login-button" onClick={handleGoogleLogin}>
        Entrar com Google
      </button>
    );
  }

  const remainingCredits = account.usageToday.remainingCredits;
  const dailyCredits = account.currentPlan.entitlements.dailyCredits;

  return (
    <div ref={menuRef} className="auth-controls account-menu-shell">
      <button type="button" className="account-trigger" onClick={() => setIsMenuOpen((current) => !current)}>
        {account.viewer.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={account.viewer.user.avatarUrl} alt={account.viewer.user.name} className="auth-avatar-image" />
        ) : (
          <span className="auth-avatar-fallback">{initials}</span>
        )}

        <span className="account-trigger-copy">
          <strong>{account.viewer.user.name}</strong>
          <small>{account.currentPlan.label}</small>
        </span>

        <span className="account-usage-pill">{remainingCredits}/{dailyCredits} hoje</span>
      </button>

      {isMenuOpen && (
        <div className="account-dropdown">
          <div className="account-dropdown-head">
            <strong>{account.currentPlan.label}</strong>
            <span>{account.viewer.user.email}</span>
          </div>

          <div className="account-dropdown-stats">
            <div>
              <span>Creditos</span>
              <strong>{account.usageToday.remainingCredits}/{account.currentPlan.entitlements.dailyCredits}</strong>
            </div>
            <div>
              <span>Imagens</span>
              <strong>{account.usageToday.remainingImages}/{account.currentPlan.entitlements.dailyImages}</strong>
            </div>
          </div>

          <div className="account-dropdown-links">
            <Link href="/conta" onClick={() => setIsMenuOpen(false)}>Minha conta</Link>
            <Link href="/contato" onClick={() => setIsMenuOpen(false)}>Falar com suporte</Link>
          </div>

          <button
            type="button"
            className="ghost-button auth-logout-button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      )}
    </div>
  );
}
