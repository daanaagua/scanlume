"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { getOrCreateBrowserId } from "@/lib/browser-id";
import { fetchAccount, joinWaitlist, type AccountResponse } from "@/lib/account";
import { API_BASE_URL } from "@/lib/site";

export function AuthControls() {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
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

  async function handleJoinWaitlist() {
    setIsJoiningWaitlist(true);

    try {
      const result = await joinWaitlist();
      setAccount((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          waitlist: result.waitlist,
        };
      });
    } finally {
      setIsJoiningWaitlist(false);
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
  const waitlistTooltip = account.waitlist.joined
    ? `Voce ja esta na lista. Hoje temos ${account.waitlist.count} pessoa(s) aguardando o lancamento de abril.`
    : `Entre na lista de espera para receber aviso por email quando os planos pagos abrirem. Hoje temos ${account.waitlist.count} pessoa(s) na fila.`;

  return (
    <div ref={menuRef} className="auth-controls account-menu-shell">
      <div className="waitlist-cta-shell">
        <button
          type="button"
          className={`solid-button waitlist-header-button${account.waitlist.joined ? " is-joined" : ""}`}
          onClick={() => void handleJoinWaitlist()}
          disabled={account.waitlist.joined || isJoiningWaitlist}
          aria-describedby="waitlist-tooltip"
        >
          {account.waitlist.joined ? "Na lista" : isJoiningWaitlist ? "Entrando..." : "Entrar na lista"}
        </button>
        <span id="waitlist-tooltip" className="waitlist-tooltip" role="tooltip">
          {waitlistTooltip}
        </span>
      </div>

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
