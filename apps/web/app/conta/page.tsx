import { AccountPanel } from "@/components/account-panel";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Minha conta",
  description:
    "Veja o plano atual, uso de hoje, creditos disponiveis e a estrutura preparada para futuras assinaturas do Scanlume.",
  pathname: "/conta",
  index: false,
});

export default function AccountPage() {
  return (
    <section className="section-band legal-band">
      <div className="container">
        <AccountPanel />
      </div>
    </section>
  );
}
