import Link from "next/link";

import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["extrair-texto-de-imagem"].title,
  description: toolPageContent["extrair-texto-de-imagem"].description,
  keywords: toolPageContent["extrair-texto-de-imagem"].keywords,
  pathname: "/extrair-texto-de-imagem",
  index: false,
});

export default function ExtractTextFromImagePage() {
  return (
    <>
      <ToolLanding slug="extrair-texto-de-imagem" />

      <section className="section-band muted-band">
        <div className="container split-content">
          <div className="section-heading">
            <p className="eyebrow">Rota principal recomendada</p>
            <h2>Para o fluxo completo de imagem para texto, concentre a navegacao na pagina principal.</h2>
            <p>
              Esta rota continua util como atalho de suporte, mas a pagina <Link href="/imagem-para-texto">Imagem para texto</Link> e a referencia central do Scanlume para o caso geral, formatos mistos e comparacao entre modos.
            </p>
            <div className="hero-actions">
              <Link href="/imagem-para-texto" className="solid-button large-button">
                Abrir imagem para texto
              </Link>
              <Link href="/ocr-online" className="ghost-button large-button">
                Ver OCR online
              </Link>
            </div>
          </div>

          <div className="check-grid">
            <article className="check-card">
              <strong>Quando ficar aqui</strong>
              <p>Quando a tarefa e apenas tirar texto de uma imagem e seguir para a proxima etapa sem aprofundar em formato ou destino final.</p>
            </article>
            <article className="check-card">
              <strong>Quando migrar para a pagina principal</strong>
              <p>Quando voce quer comparar modos, cobrir varios tipos de arquivo ou concentrar o fluxo central de OCR do produto.</p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
