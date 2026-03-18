import Link from "next/link";

import { ToolLanding } from "@/components/tool-landing";
import { buildMetadata, toolPageContent } from "@/lib/site";

export const metadata = buildMetadata({
  title: toolPageContent["transcrever-imagem-em-texto"].title,
  description: toolPageContent["transcrever-imagem-em-texto"].description,
  keywords: toolPageContent["transcrever-imagem-em-texto"].keywords,
  pathname: "/transcrever-imagem-em-texto",
  index: false,
});

export default function TranscribeImageToTextPage() {
  return (
    <>
      <ToolLanding slug="transcrever-imagem-em-texto" />

      <section className="section-band muted-band">
        <div className="container split-content">
          <div className="section-heading">
            <p className="eyebrow">Centralizar sinal</p>
            <h2>Quando a busca for ampla, use a rota principal de imagem para texto.</h2>
            <p>
              Esta pagina fala mais de reaproveitamento e edicao posterior. Para o caso geral de OCR, a referencia central continua sendo <Link href="/imagem-para-texto">Imagem para texto</Link>, onde o Scanlume concentra o fluxo principal e os links de apoio.
            </p>
            <div className="hero-actions">
              <Link href="/imagem-para-texto" className="solid-button large-button">
                Ir para imagem para texto
              </Link>
              <Link href="/imagem-para-word" className="ghost-button large-button">
                Ver imagem para Word
              </Link>
            </div>
          </div>

          <div className="check-grid">
            <article className="check-card">
              <strong>Quando esta rota ajuda</strong>
              <p>Quando a imagem vira base para resumo, briefing, documentacao ou outra tarefa que vai mexer bastante no texto depois do OCR.</p>
            </article>
            <article className="check-card">
              <strong>Quando a principal resolve melhor</strong>
              <p>Quando voce so quer a melhor pagina geral para converter imagem em texto, comparar formatos e acionar o OCR sem escolher um recorte semantico menor.</p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
