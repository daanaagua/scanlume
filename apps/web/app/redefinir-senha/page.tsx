import type { Metadata } from "next";

import { PasswordResetForm } from "@/components/password-reset-form";

export const metadata: Metadata = {
  title: "Redefinir senha | Scanlume",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <section className="legal-band">
      <div className="container account-panel-shell">
        <div className="account-hero-card legal-copy">
          <p className="eyebrow">Conta</p>
          <h1>Redefinir senha</h1>
          <p>Crie uma nova senha para continuar entrando com email e senha no Scanlume.</p>
        </div>

        <div className="account-card">
          {token ? (
            <PasswordResetForm token={token} />
          ) : (
            <p className="auth-modal-note">O link esta incompleto. Volte ao email e abra novamente o link de redefinicao.</p>
          )}
        </div>
      </div>
    </section>
  );
}
