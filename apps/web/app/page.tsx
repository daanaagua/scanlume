import Link from "next/link";

import { FaqList } from "@/components/faq-list";
import { JsonLd } from "@/components/json-ld";
import { OcrWorkspace } from "@/components/ocr-workspace";
import { BLOG_PATH, BLOG_POSTS } from "@/lib/blog";
import {
  buildMetadata,
  EVIDENCE_PATH,
  FORMATTED_MODE_LABEL,
  HOME_FLOW_LINKS,
  homeFaqs,
  OCR_WORKSPACE_ID,
  SITE_NAME,
  SITE_URL,
  SIMPLE_MODE_LABEL,
  toolPageContent,
} from "@/lib/site";

export const metadata = buildMetadata({
  title: "Scanlume | OCR online em pt-BR para imagens e PDF",
  description:
    "OCR online do Scanlume para converter screenshots, JPG, PNG e PDF em texto editavel com saida simples ou formatada em TXT, Markdown, HTML e PDF, com metodo editorial e revisao explicitados.",
  keywords: [
    "scanlume",
    "ocr online pt-br",
    "ocr para screenshot",
    "ocr para jpg",
    "ocr para png",
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
            `${SIMPLE_MODE_LABEL} para texto puro`,
            `${FORMATTED_MODE_LABEL} para leitura principal organizada`,
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

      <section id={OCR_WORKSPACE_ID} className="tool-first-home">
        <div className="container tool-first-home-inner">
          <div className="tool-first-intro">
            <p className="eyebrow scanlume-signal-label">Scanlume OCR</p>
            <h1>OCR online em pt-BR</h1>
            <p>
              Envie imagem ou PDF, extraia texto editavel e baixe em TXT, Markdown, HTML ou PDF.
            </p>
            <div className="tool-first-pills" aria-label="Recursos principais">
              <span>Gratis para testar</span>
              <span>Imagem e PDF</span>
              <span>TXT, MD, HTML, PDF</span>
            </div>
          </div>

          <div className="tool-first-workspace">
            <OcrWorkspace defaultMode="simple" priorityLayout />
          </div>
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Como funciona</p>
            <h2>Upload, OCR e download em um fluxo direto.</h2>
            <p>
              O fluxo foi desenhado para reduzir atrito: envio imediato, previa no navegador e exportacao simples para continuar o trabalho em outro lugar.
            </p>
          </div>

          <div className="timeline-grid">
            <article className="timeline-step">
              <span>01</span>
              <strong>Envie uma imagem ou PDF</strong>
              <p>Use screenshot, JPG, PNG, poster, foto tirada no celular ou um PDF ja pronto para OCR.</p>
            </article>
            <article className="timeline-step">
              <span>02</span>
              <strong>Escolha o modo</strong>
              <p>
                {SIMPLE_MODE_LABEL} para texto puro em imagens. {FORMATTED_MODE_LABEL} para preservar a leitura principal em imagens e PDF.
              </p>
            </article>
            <article className="timeline-step">
              <span>03</span>
              <strong>Copie ou baixe</strong>
              <p>Baixe TXT, Markdown, HTML, PDF pesquisavel ou PDF reorganizado, ou copie o texto direto para Word e docs internos.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Escolha o fluxo</p>
            <h2>Comece pela rota principal e refine o fluxo so quando houver um contexto especifico.</h2>
            <p>
              A pagina <Link href="/imagem-para-texto">Imagem para texto</Link> concentra o caso geral. As rotas abaixo existem para formatos e cenarios mais especificos, sem competir com a rota central do produto.
            </p>
          </div>

          <div className="related-grid">
            {HOME_FLOW_LINKS.map((link) => {
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
            <p className="eyebrow">Guias praticos</p>
            <h2>Guias praticos para escolher formato, modo e exportacao.</h2>
            <p>
              Publicamos conteudo complementar para responder duvidas reais sobre OCR em portugues, diferenca entre formatos, PDF pesquisavel e exportacao para Word e Markdown.
            </p>
            <p>
              A pagina de <Link href={EVIDENCE_PATH}>metodo e evidencia</Link> mostra como validamos os exemplos, revisamos os textos e marcamos as atualizacoes.
            </p>
            <div className="hero-actions">
              <Link href={BLOG_PATH} className="ghost-button large-button">
                Abrir blog
              </Link>
            </div>
          </div>

          <div className="blog-card-grid compact-blog-grid">
            {BLOG_POSTS.map((post) => (
              <article key={post.slug} className="blog-card-surface compact-blog-card">
                <div className="blog-card-copy">
                  <div className="blog-card-meta">
                    <span>{post.category}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <strong>{post.title}</strong>
                  <p>{post.excerpt}</p>
                </div>

                <Link href={`${BLOG_PATH}/${post.slug}`} className="ghost-button large-button blog-card-button">
                  Ler guia
                </Link>
              </article>
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
