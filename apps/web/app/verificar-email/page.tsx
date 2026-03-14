import type { Metadata } from "next";

import { EmailVerificationStatus } from "@/components/email-verification-status";

export const metadata: Metadata = {
  title: "Confirmar email | Scanlume",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function VerifyEmailPage({
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
          <h1>Confirmar email</h1>
          <p>Estamos validando o link enviado para sua caixa de entrada.</p>
        </div>

        <div className="account-card">
          {token ? (
            <EmailVerificationStatus token={token} />
          ) : (
            <p className="auth-modal-note">O link esta incompleto. Abra novamente o email de confirmacao e tente outra vez.</p>
          )}
        </div>
      </div>
    </section>
  );
}
