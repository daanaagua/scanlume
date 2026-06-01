"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AuthDialog } from "@/components/auth-dialog";
import { getOrCreateBrowserId } from "@/lib/browser-id";
import { fetchAccount, joinWaitlist, type AccountResponse } from "@/lib/account";
import { API_BASE_URL } from "@/lib/site";
import { resolveClientLocale, type ClientLocale } from "@/lib/client-locale";
import { subscribeUsageRefresh } from "@/lib/usage-sync";

const AUTH_CONTROLS_COPY = {
  "pt-BR": {
    fallbackName: "Conta",
    signIn: "Entrar",
    credits: "creditos",
    creditsHeading: "Creditos",
    accountLink: "Minha conta",
    supportLink: "Falar com suporte",
    waitlistJoined: "Na lista",
    waitlistJoining: "Entrando...",
    waitlistJoin: "Entrar na lista",
    waitlistJoinedTooltip: (count: number) =>
      `Voce ja esta na lista. Hoje temos ${count} pessoa(s) aguardando o lancamento de abril.`,
    waitlistOpenTooltip: (count: number) =>
      `Entre na lista de espera para receber aviso por email quando os planos pagos abrirem. Hoje temos ${count} pessoa(s) na fila.`,
    signingOut: "Saindo...",
    signOut: "Sair",
  },
  en: {
    fallbackName: "Account",
    signIn: "Sign in",
    credits: "credits",
    creditsHeading: "Credits",
    accountLink: "My account",
    supportLink: "Contact support",
    waitlistJoined: "On the list",
    waitlistJoining: "Joining...",
    waitlistJoin: "Join the list",
    waitlistJoinedTooltip: (count: number) =>
      `You are already on the list. ${count} person(s) are waiting for the April launch today.`,
    waitlistOpenTooltip: (count: number) =>
      `Join the waitlist to get an email when paid plans open. ${count} person(s) are in line today.`,
    signingOut: "Signing out...",
    signOut: "Sign out",
  },
} as const;

function formatAccountPlanLabel(plan: Pick<AccountResponse["currentPlan"], "id" | "label">, locale: ClientLocale) {
  if (locale !== "en") {
    return plan.label;
  }

  if (plan.id === "anonymous") {
    return "Free trial";
  }
  if (plan.id === "free") {
    return "Free account";
  }

  return plan.label
    .replace(/Teste gratis/gi, "Free trial")
    .replace(/Conta gratuita/gi, "Free account")
    .replace(/mensal/gi, "monthly")
    .replace(/anual/gi, "yearly");
}

export function AuthControls({ locale }: { locale?: ClientLocale } = {}) {
  const pathname = usePathname();
  const resolvedLocale = resolveClientLocale(locale, pathname);
  const isEnglish = resolvedLocale === "en";
  const copy = AUTH_CONTROLS_COPY[resolvedLocale];
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const browserId = getOrCreateBrowserId();
    const loadAccount = () => {
      void fetchAccount(browserId)
        .then((data) => setAccount(data))
        .catch(() => setAccount(null));
    };

    loadAccount();
    return subscribeUsageRefresh(loadAccount);
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

  const firstName = useMemo(() => {
    const name = account?.viewer.user?.name?.trim();
    return name ? name.split(/\s+/)[0] : copy.fallbackName;
  }, [account?.viewer.user?.name, copy.fallbackName]);

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
      <>
        <button type="button" className="ghost-button auth-login-button" onClick={() => setIsAuthDialogOpen(true)}>
          {copy.signIn}
        </button>
        <AuthDialog open={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} locale={resolvedLocale} />
      </>
    );
  }

  const remainingCredits = account.usage.remainingCredits;
  const grantedCredits = account.usage.grantedCredits;
  const waitlistTooltip = account.waitlist.joined
    ? copy.waitlistJoinedTooltip(account.waitlist.count)
    : copy.waitlistOpenTooltip(account.waitlist.count);
  const accountHref = isEnglish ? "/en/account" : "/conta";
  const supportHref = isEnglish ? "/en/contact" : "/contato";
  const planLabel = formatAccountPlanLabel(account.currentPlan, resolvedLocale);

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
          <strong>{firstName}</strong>
          <small>{planLabel}</small>
        </span>

        <span className="account-usage-pill">{remainingCredits}/{grantedCredits} {copy.credits}</span>
      </button>

      {isMenuOpen && (
        <div className="account-dropdown">
          <div className="account-dropdown-head">
            <strong>{planLabel}</strong>
            <span>{account.viewer.user.email}</span>
          </div>

          <div className="account-dropdown-stats">
            <div>
              <span>{copy.creditsHeading}</span>
              <strong>{account.usage.remainingCredits}/{account.usage.grantedCredits}</strong>
            </div>
          </div>

          <div className="waitlist-account-panel">
            <span>{waitlistTooltip}</span>
            <button
              type="button"
              className={`solid-button waitlist-account-button${account.waitlist.joined ? " is-joined" : ""}`}
              onClick={() => void handleJoinWaitlist()}
              disabled={account.waitlist.joined || isJoiningWaitlist}
            >
              {account.waitlist.joined ? copy.waitlistJoined : isJoiningWaitlist ? copy.waitlistJoining : copy.waitlistJoin}
            </button>
          </div>

          <div className="account-dropdown-links">
            <Link href={accountHref} onClick={() => setIsMenuOpen(false)}>{copy.accountLink}</Link>
            <Link href={supportHref} onClick={() => setIsMenuOpen(false)}>{copy.supportLink}</Link>
          </div>

          <button
            type="button"
            className="ghost-button auth-logout-button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? copy.signingOut : copy.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
