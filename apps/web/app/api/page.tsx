import Link from "next/link";

import { CodeExampleTabs } from "@/components/code-example-tabs";
import { API_CODE_EXAMPLES, API_INPUT_NOTE } from "@/lib/pricing";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "API do Scanlume",
  description: "Guia rapido para autenticar, comprar API credits e integrar o OCR do Scanlume.",
  pathname: "/api",
});

export default function ApiPage() {
  return (
    <section className="section-band legal-band">
      <div className="container" style={{ display: "grid", gap: "1.5rem" }}>
        <div>
          <p className="eyebrow">Developer API</p>
          <h1>Integre o OCR do Scanlume em apps, automacoes e processos internos.</h1>
          <p>Compre API credits, gere chaves na sua conta e use os exemplos abaixo para iniciar a integracao.</p>
          <p>{API_INPUT_NOTE}</p>
        </div>
        <CodeExampleTabs examples={API_CODE_EXAMPLES} />
        <div className="hero-actions">
          <Link href="/precos" className="solid-button large-button">Ver planos</Link>
          <Link href="/conta" className="ghost-button large-button">Abrir conta</Link>
        </div>
      </div>
    </section>
  );
}
