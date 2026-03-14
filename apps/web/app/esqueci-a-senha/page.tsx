import type { Metadata } from "next";

import { PasswordResetRequest } from "@/components/password-reset-request";

export const metadata: Metadata = {
  title: "Esqueci a senha | Scanlume",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return (
    <section className="legal-band">
      <div className="container account-panel-shell">
        <div className="account-hero-card legal-copy">
          <p className="eyebrow">Conta</p>
          <h1>Esqueci minha senha</h1>
          <p>Informe o email da conta. Se ele existir e ja tiver sido confirmado, enviaremos um link para criar uma nova senha.</p>
        </div>

        <div className="account-card">
          <PasswordResetRequest />
        </div>
      </div>
    </section>
  );
}
