"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { loginWithPassword, registerWithPassword, startGoogleLogin } from "@/lib/auth";
import type { ClientLocale } from "@/lib/client-locale";

type AuthDialogMode = "login" | "register";

const AUTH_DIALOG_COPY = {
  "pt-BR": {
    account: "Conta",
    loginTitle: "Entrar na sua conta",
    registerTitle: "Criar conta gratis",
    closeLogin: "Fechar login",
    modeAria: "Modo de autenticacao",
    loginTab: "Entrar",
    registerTab: "Criar conta",
    google: "Continuar com Google",
    divider: "ou use email e senha",
    name: "Nome",
    namePlaceholder: "Seu nome",
    email: "Email",
    emailPlaceholder: "seu@email.com",
    password: "Senha",
    passwordPlaceholder: "Minimo de 8 caracteres",
    registerNoticeDelivered: (emailHint: string) =>
      `Conta criada. Enviamos um link de verificacao para ${emailHint}. Confirme o email para liberar o login.`,
    registerNoticeNoEmail: (emailHint: string) =>
      `Conta criada para ${emailHint}, mas o envio de email ainda nao esta configurado neste ambiente.`,
    fallbackError: "Nao foi possivel autenticar agora.",
    loginSubmitting: "Entrando...",
    registerSubmitting: "Criando conta...",
    loginSubmit: "Entrar com email",
    registerSubmit: "Criar conta com email",
    forgotPassword: "Esqueci minha senha",
    loginNote: "Se voce ja entrou com Google antes, pode continuar com Google ou criar uma senha usando o mesmo email.",
    registerNote: "Se este email ja existe via Google, vamos anexar a senha na mesma conta para voce entrar dos dois jeitos.",
  },
  en: {
    account: "Account",
    loginTitle: "Sign in to your account",
    registerTitle: "Create a free account",
    closeLogin: "Close login",
    modeAria: "Authentication mode",
    loginTab: "Sign in",
    registerTab: "Create account",
    google: "Continue with Google",
    divider: "or use email and password",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "Minimum 8 characters",
    registerNoticeDelivered: (emailHint: string) =>
      `Account created. We sent a verification link to ${emailHint}. Confirm your email to enable sign-in.`,
    registerNoticeNoEmail: (emailHint: string) =>
      `Account created for ${emailHint}, but email delivery is not configured in this environment yet.`,
    fallbackError: "Could not authenticate right now.",
    loginSubmitting: "Signing in...",
    registerSubmitting: "Creating account...",
    loginSubmit: "Sign in with email",
    registerSubmit: "Create account with email",
    forgotPassword: "Forgot your password?",
    loginNote: "If you used Google before, continue with Google or create a password with the same email.",
    registerNote: "If this email already exists through Google, we attach the password to the same account.",
  },
} as const;

export function AuthDialog({
  open,
  onClose,
  defaultMode = "login",
  googleRedirectTo,
  onSuccess,
  reloadOnSuccess = true,
  locale = "pt-BR",
}: {
  open: boolean;
  onClose: () => void;
  defaultMode?: AuthDialogMode;
  googleRedirectTo?: string;
  onSuccess?: () => void;
  reloadOnSuccess?: boolean;
  locale?: ClientLocale;
}) {
  const [mode, setMode] = useState<AuthDialogMode>(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setMode(defaultMode);
    setError(null);
    setNotice(null);
  }, [defaultMode, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  const copy = AUTH_DIALOG_COPY[locale];
  const title = useMemo(() => (mode === "login" ? copy.loginTitle : copy.registerTitle), [copy, mode]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "login") {
        await loginWithPassword({ email, password });
        onSuccess?.();
        onClose();
        if (reloadOnSuccess) {
          window.location.reload();
        }
      } else {
        const result = await registerWithPassword({ name, email, password });
        setNotice(
          result.verification.emailDeliveryConfigured
            ? copy.registerNoticeDelivered(result.emailHint)
            : copy.registerNoticeNoEmail(result.emailHint),
        );
        setMode("login");
        setPassword("");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : copy.fallbackError);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleClick() {
    startGoogleLogin(googleRedirectTo);
  }

  return (
    <div className="auth-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="auth-modal-head">
          <div>
            <p className="eyebrow">{copy.account}</p>
            <h2 id="auth-modal-title">{title}</h2>
          </div>
          <button type="button" className="auth-modal-close" onClick={onClose} aria-label={copy.closeLogin}>
            x
          </button>
        </div>

        <div className="auth-modal-tabs" role="tablist" aria-label={copy.modeAria}>
          <button
            type="button"
            className={mode === "login" ? "is-active" : ""}
            onClick={() => setMode("login")}
          >
            {copy.loginTab}
          </button>
          <button
            type="button"
            className={mode === "register" ? "is-active" : ""}
            onClick={() => setMode("register")}
          >
            {copy.registerTab}
          </button>
        </div>

        <button type="button" className="ghost-button auth-provider-button" onClick={handleGoogleClick}>
          {copy.google}
        </button>

        <div className="auth-modal-divider">
          <span>{copy.divider}</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="auth-field">
              <span>{copy.name}</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={copy.namePlaceholder}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span>{copy.email}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={copy.emailPlaceholder}
              autoComplete={mode === "login" ? "email" : "username"}
              required
            />
          </label>

          <label className="auth-field">
            <span>{copy.password}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={copy.passwordPlaceholder}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              required
            />
          </label>

          {error && <p className="auth-form-error">{error}</p>}
          {notice && <p className="auth-modal-note auth-form-success">{notice}</p>}

          <button type="submit" className="solid-button auth-submit-button" disabled={isSubmitting}>
            {isSubmitting
              ? mode === "login"
                ? copy.loginSubmitting
                : copy.registerSubmitting
              : mode === "login"
                ? copy.loginSubmit
                : copy.registerSubmit}
          </button>

          {mode === "login" && (
            <Link href="/esqueci-a-senha" className="auth-inline-link" onClick={onClose}>
              {copy.forgotPassword}
            </Link>
          )}
        </form>

        <p className="auth-modal-note">
          {mode === "login" ? copy.loginNote : copy.registerNote}
        </p>
      </div>
    </div>
  );
}
