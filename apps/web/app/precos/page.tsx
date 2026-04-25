import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { PricingPage } from "@/components/pricing-page";
import { API_PRICING, WEB_PRICING } from "@/lib/pricing";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Precos e planos do Scanlume | Web, API e duvidas comuns",
  description:
    "Compare planos Web e API do Scanlume, veja credits e limites, e encontre respostas rapidas para cobranca, uso e duvidas comuns.",
  keywords: ["precos scanlume", "planos scanlume", "web credits", "api credits", "duvidas comuns"],
  pathname: "/precos",
});

export default function PricingRoute() {
  const canonical = "https://www.scanlume.com/precos";
  const offerEntries = [
    ...WEB_PRICING.monthly.map((plan) => ({
      "@type": "Offer",
      name: `Web ${plan.name}`,
      price: plan.price.replace(/[^0-9.]/g, ""),
      priceCurrency: "USD",
      category: "Web OCR",
      availability: "https://schema.org/InStock",
    })),
    ...API_PRICING.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price.replace(/[^0-9.]/g, ""),
      priceCurrency: "USD",
      category: "API OCR",
      availability: "https://schema.org/InStock",
    })),
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Precos e planos do Scanlume",
          url: canonical,
          inLanguage: "pt-BR",
          description:
            "Compare planos Web e API do Scanlume, veja credits e limites, e encontre respostas rapidas para cobranca, uso e duvidas comuns.",
          mainEntity: {
            "@type": "OfferCatalog",
            name: "Planos Scanlume",
            itemListElement: offerEntries,
          },
        }}
      />
      <PricingPage />
      <section className="section-band muted-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Antes da compra</p>
            <h2>Escolha plano com menos achismo e menos retrabalho.</h2>
            <p>
              Estes guias respondem duas duvidas que travam a conversao: quando o fluxo web basta e quando a API faz
              mais sentido, e quando o modo simples ja resolve versus quando vale subir para texto formatado.
            </p>
          </div>

          <div className="related-grid">
            <Link href="/blog/quando-usar-ocr-no-navegador-vs-api" className="related-card blog-related-card">
              <span>Integracao</span>
              <strong>Quando usar OCR no navegador e quando migrar para API</strong>
              <p>Comparar fluxo manual, automacao, credits separados e sinais de migracao.</p>
            </Link>
            <Link href="/blog/ocr-simples-vs-texto-formatado" className="related-card blog-related-card">
              <span>Guia de decisao</span>
              <strong>OCR simples ou texto formatado: quando usar cada modo?</strong>
              <p>Entender quando velocidade basta e quando estrutura poupa mais tempo no destino final.</p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
