"use client";

import { useState } from "react";

import { requestPasswordReset } from "@/lib/auth";

export function PasswordResetRequest() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const result = await requestPasswordReset({ email });
      setStatus(result.message ?? "Se o email existir, enviaremos um link em instantes.");
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Nao foi possivel enviar o link agora.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field">
        <span>Email da conta</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@empresa.com"
          autoComplete="email"
          required
        />
      </label>

      <button type="submit" className="solid-button auth-submit-button" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar link de redefinicao"}
      </button>

      {status && <p className="auth-modal-note">{status}</p>}
    </form>
  );
}
