import Link from "next/link";

import { FaqList } from "@/components/faq-list";
import { JsonLd } from "@/components/json-ld";
import { OcrWorkspace } from "@/components/ocr-workspace";
import {
  buildMetadata,
  homeFaqs,
  OCR_WORKSPACE_ID,
  SEO_LINKS,
  SITE_NAME,
  SITE_URL,
  toolPageContent,
} from "@/lib/site";

export const metadata = buildMetadata({
  title: "Imagem para texto online com IA | OCR simples e formatado",
  description:
    "Converta imagem para texto com IA em pt-BR. OCR online gratis para screenshots, JPG e PNG com exportacao em TXT, Markdown e HTML.",
  keywords: [
    "imagem para texto",
    "converter imagem em texto",
    "imagem em texto",
    "ocr online",
    "ocr com ia",
  ],
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
          description:
            "Ferramenta OCR com IA para converter imagem em texto em pt-BR com saida simples ou formatada.",
          featureList: [
            "OCR com IA em pt-BR",
            "Simple OCR para texto puro",
            "Formatted Text para leitura principal organizada",
            "Exportacao em TXT, Markdown e HTML",
          ],
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
              Scanlume ajuda o mercado pt-BR a converter imagem em texto com IA, copiar com menos limpeza manual e baixar em TXT, Markdown ou HTML sem instalar app.
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
            <a href={`#${OCR_WORKSPACE_ID}`} className="solid-button large-button">
              Teste gratis agora
            </a>
          </div>
        </div>
      </section>

      <section id={OCR_WORKSPACE_ID} className="section-band">
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
            <p className="eyebrow">Paginas indexaveis</p>
            <h2>Uma malha de paginas para formatos, cenarios e capacidades em pt-BR.</h2>
            <p>
              Em vez de replicar a mesma copy para sinonimos, o cluster abaixo separa formato de arquivo, contexto de uso e capacidade do OCR.
            </p>
          </div>

          <div className="related-grid">
            {SEO_LINKS.map((link) => {
              const page = toolPageContent[link.href.replace("/", "") as keyof typeof toolPageContent];

              return (
                <Link key={link.href} href={link.href} className="related-card">
                  <span>{page.eyebrow}</span>
                  <strong>{page.label}</strong>
                  <p>{page.lead}</p>
                </Link>
              );
            })}
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
