import Link from "next/link";

import { CodeExampleTabs } from "@/components/code-example-tabs";
import { JsonLd } from "@/components/json-ld";
import { API_CODE_EXAMPLES, API_INPUT_NOTE } from "@/lib/pricing";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "API do Scanlume | guia, exemplos e perguntas frequentes",
  description:
    "Integre o OCR do Scanlume com API key e base64 data URL, veja exemplos de uso e respostas rapidas para perguntas frequentes sobre a API.",
  keywords: ["scanlume api", "ocr api", "api key", "base64 data url", "perguntas frequentes"],
  pathname: "/api",
});

export default function ApiPage() {
  const canonical = "https://www.scanlume.com/api";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Scanlume OCR API",
          serviceType: "OCR API",
          provider: {
            "@type": "Organization",
            name: "Scanlume",
            url: "https://www.scanlume.com",
          },
          url: canonical,
          inLanguage: "pt-BR",
          areaServed: "Worldwide",
          description:
            "Integre o OCR do Scanlume com API key e base64 data URL, veja exemplos de uso e respostas rapidas para perguntas frequentes sobre a API.",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Como autenticar na API do Scanlume?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Use uma API key no header Authorization com o formato Bearer e envie a chamada para o endpoint de OCR.",
              },
            },
            {
              "@type": "Question",
              name: "Qual formato a API aceita como entrada?",
              acceptedAnswer: {
                "@type": "Answer",
                text: API_INPUT_NOTE,
              },
            },
            {
              "@type": "Question",
              name: "A API separa credits da web?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sim. API credits sao separados dos web credits, entao o saldo de integracao nao mistura com o uso no navegador.",
              },
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://www.scanlume.com/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "API",
              item: canonical,
            },
          ],
        }}
      />
      <section className="tool-first-home">
        <div className="container tool-first-home-inner">
          <div className="tool-first-intro">
            <p className="eyebrow scanlume-signal-label">Developer API</p>
            <h1>API do Scanlume</h1>
            <p>
              Integre o OCR do Scanlume em apps, automacoes e processos internos.
            </p>
            <p>{API_INPUT_NOTE}</p>
            <div className="tool-first-pills" aria-label="Recursos da API">
              <span>Alta velocidade</span>
              <span>Retorno estruturado</span>
              <span>Base64 data URL</span>
            </div>
            <Link href="/blog/quando-usar-ocr-no-navegador-vs-api" className="blog-compact-link">
              Navegador ou API?
            </Link>
          </div>

          <div className="api-code-shell">
            <CodeExampleTabs examples={API_CODE_EXAMPLES} />
          </div>

          <div className="hero-actions">
            <Link href="/precos" className="solid-button large-button">
              Ver planos
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
