import { PricingPage } from "@/components/pricing-page";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Precos do Scanlume",
  description: "Planos Web e API do Scanlume com credits separados, exemplos de uso e detalhes de cobranca.",
  pathname: "/precos",
});

export default function PricingRoute() {
  return <PricingPage />;
}
