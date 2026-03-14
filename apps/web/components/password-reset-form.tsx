"use client";

import { useState } from "react";

import { resetPassword } from "@/lib/auth";

export function PasswordResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setStatus("As senhas precisam ser iguais.");
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      await resetPassword({ token, password });
      setStatus("Senha atualizada com sucesso. Vamos recarregar sua sessao.");
      window.location.href = "/conta";
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Nao foi possivel redefinir a senha.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field">
        <span>Nova senha</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimo de 8 caracteres"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      <label className="auth-field">
        <span>Repita a senha</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repita a nova senha"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      <button type="submit" className="solid-button auth-submit-button" disabled={isSubmitting}>
        {isSubmitting ? "Atualizando..." : "Salvar nova senha"}
      </button>

      {status && <p className="auth-modal-note">{status}</p>}
    </form>
  );
}
