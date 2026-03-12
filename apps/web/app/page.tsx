import Link from "next/link";

import { FaqList } from "@/components/faq-list";
import { JsonLd } from "@/components/json-ld";
import { OcrWorkspace } from "@/components/ocr-workspace";
import { buildMetadata, homeFaqs, NAV_LINKS, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Imagem para texto online com OCR simples e formatado",
  description:
    "Converter imagem em texto online com OCR simples e formatado. Gratis para testar, sem instalar aplicativo e com download em TXT, Markdown e HTML.",
  pathname: "/",
});

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `${SITE_NAME} OCR`,
          url: SITE_URL,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Any",
          inLanguage: "pt-BR",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: homeFaqs.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }}
      />

      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Converter imagem em texto online</p>
            <h1>OCR simples e formatado para screenshots, JPG e PNG.</h1>
            <p className="hero-lead">
              Scanlume ajuda o mercado pt-BR a extrair texto rapido, copiar com menos limpeza manual e baixar em TXT, Markdown ou HTML sem instalar app.
            </p>
            <div className="hero-bullets">
              <span>Gratis para testar</span>
              <span>Sem instalar aplicativo</span>
              <span>Copiar ou baixar em TXT, MD e HTML</span>
            </div>
            <div className="hero-actions">
              <Link href="/imagem-para-texto" className="solid-button large-button">
                Abrir a ferramenta
              </Link>
              <Link href="/imagem-para-word" className="ghost-button large-button">
                Ver modo formatado
              </Link>
            </div>
          </div>

          <div className="hero-card stacked-hero-card">
            <div>
              <p className="card-label">Modo 01</p>
              <h2>Simple OCR</h2>
              <p>Mais rapido, mais barato e focado em texto puro para prints, posters e fotos do celular.</p>
            </div>
            <div>
              <p className="card-label">Modo 02</p>
              <h2>Formatted Text</h2>
              <p>Preserva a estrutura principal com headings, paragraphs e uma ordem de leitura melhor para Word e Markdown.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container">
          <OcrWorkspace defaultMode="simple" />
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container split-content">
          <div>
            <p className="eyebrow">Como funciona</p>
            <h2>Upload, OCR e download em um fluxo direto.</h2>
            <p>
              O MVP foi desenhado para validar SEO e conversao com uma experiencia leve: envio imediato, preview no navegador e exportacao simples.
            </p>
          </div>

          <div className="timeline-grid">
            <article className="timeline-step">
              <span>01</span>
              <strong>Envie uma imagem</strong>
              <p>Use screenshot, JPG, PNG, poster ou foto tirada no celular.</p>
            </article>
            <article className="timeline-step">
              <span>02</span>
              <strong>Escolha o modo</strong>
              <p>Simple OCR para texto puro. Formatted Text para preservar a leitura principal.</p>
            </article>
            <article className="timeline-step">
              <span>03</span>
              <strong>Copie ou baixe</strong>
              <p>Baixe TXT, Markdown ou HTML, ou copie o texto direto para Word e docs internos.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Paginas alvo</p>
            <h2>Uma pagina principal mais uma rede de long tails com intencao clara.</h2>
          </div>

          <div className="related-grid">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="related-card">
                <span>{link.label}</span>
                <strong>{link.label}</strong>
                <p>Pagina dedicada com foco em SEO, FAQ e acesso rapido a ferramenta.</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">FAQ</p>
            <h2>Perguntas frequentes sobre `imagem para texto`.</h2>
          </div>
          <FaqList items={homeFaqs} />
        </div>
      </section>
    </>
  );
}
