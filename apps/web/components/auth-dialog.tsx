"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { loginWithPassword, registerWithPassword, startGoogleLogin } from "@/lib/auth";

type AuthDialogMode = "login" | "register";

export function AuthDialog({
  open,
  onClose,
  defaultMode = "login",
  googleRedirectTo,
  onSuccess,
  reloadOnSuccess = true,
}: {
  open: boolean;
  onClose: () => void;
  defaultMode?: AuthDialogMode;
  googleRedirectTo?: string;
  onSuccess?: () => void;
  reloadOnSuccess?: boolean;
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

  const title = useMemo(
    () => (mode === "login" ? "Entrar na sua conta" : "Criar conta gratis"),
    [mode],
  );

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
            ? `Conta criada. Enviamos um link de verificacao para ${result.emailHint}. Confirme o email para liberar o login.`
            : `Conta criada para ${result.emailHint}, mas o envio de email ainda nao esta configurado neste ambiente.`,
        );
        setMode("login");
        setPassword("");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nao foi possivel autenticar agora.");
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
            <p className="eyebrow">Conta</p>
            <h2 id="auth-modal-title">{title}</h2>
          </div>
          <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Fechar login">
            x
          </button>
        </div>

        <div className="auth-modal-tabs" role="tablist" aria-label="Modo de autenticacao">
          <button
            type="button"
            className={mode === "login" ? "is-active" : ""}
            onClick={() => setMode("login")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={mode === "register" ? "is-active" : ""}
            onClick={() => setMode("register")}
          >
            Criar conta
          </button>
        </div>

        <button type="button" className="ghost-button auth-provider-button" onClick={handleGoogleClick}>
          Continuar com Google
        </button>

        <div className="auth-modal-divider">
          <span>ou use email e senha</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="auth-field">
              <span>Nome</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@empresa.com"
              autoComplete={mode === "login" ? "email" : "username"}
              required
            />
          </label>

          <label className="auth-field">
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo de 8 caracteres"
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
                ? "Entrando..."
                : "Criando conta..."
              : mode === "login"
                ? "Entrar com email"
                : "Criar conta com email"}
          </button>

          {mode === "login" && (
            <Link href="/esqueci-a-senha" className="auth-inline-link" onClick={onClose}>
              Esqueci minha senha
            </Link>
          )}
        </form>

        <p className="auth-modal-note">
          {mode === "login"
            ? "Se voce ja entrou com Google antes, pode continuar com Google ou criar uma senha usando o mesmo email."
            : "Se este email ja existe via Google, vamos anexar a senha na mesma conta para voce entrar dos dois jeitos."}
        </p>
      </div>
    </div>
  );
}
