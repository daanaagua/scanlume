import Link from "next/link";

import { FaqList } from "@/components/faq-list";
import { JsonLd } from "@/components/json-ld";
import { OcrWorkspace } from "@/components/ocr-workspace";
import {
  homeFaqs,
  OCR_WORKSPACE_ID,
  SITE_NAME,
  SITE_URL,
  toolPageContent,
  type ToolPageSlug,
} from "@/lib/site";

export function ToolLanding({ slug }: { slug: ToolPageSlug }) {
  const page = toolPageContent[slug];
  const relatedPages = Object.entries(toolPageContent).filter(([key]) => key !== slug);
  const canonical = `${SITE_URL}/${slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `${SITE_NAME} - ${page.h1}`,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Any",
          url: canonical,
          inLanguage: "pt-BR",
          description: page.description,
          featureList: [
            "OCR com IA em pt-BR",
            "Simple OCR para texto puro",
            "Formatted Text com estrutura principal preservada",
            "Download em TXT, Markdown e HTML",
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: SITE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: page.h1,
              item: canonical,
            },
          ],
        }}
      />

      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{page.eyebrow}</p>
            <h1>{page.h1}</h1>
            <p className="hero-lead">{page.lead}</p>
            <div className="hero-actions hero-inline-actions">
              <a href={`#${OCR_WORKSPACE_ID}`} className="solid-button large-button hero-primary-cta">
                Usar agora
              </a>
              <span className="hero-action-note">Teste gratis direto no navegador</span>
            </div>
            <div className="hero-bullets">
              <span>Gratis para testar</span>
              <span>Sem instalar aplicativo</span>
              <span>TXT, Markdown e HTML</span>
            </div>
          </div>

          <div className="hero-card editorial-card">
            <div>
              <p className="card-label">Modo rapido</p>
              <h2>Simple OCR</h2>
              <p>Texto puro, sem thinking, mais veloz para screenshot, poster e foto do celular.</p>
            </div>
            <div>
              <p className="card-label">Modo estruturado</p>
              <h2>Formatted Text</h2>
              <p>Preserva a estrutura principal com headings, paragraphs e uma leitura mais clara.</p>
            </div>
            <a href={`#${OCR_WORKSPACE_ID}`} className="solid-button large-button">
              Teste gratis agora
            </a>
          </div>
        </div>
      </section>

      <section id={OCR_WORKSPACE_ID} className="section-band">
        <div className="container">
          <OcrWorkspace defaultMode={slug === "imagem-para-word" ? "formatted" : "simple"} />
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container split-content">
          <div>
            <p className="eyebrow">Quando usar</p>
            <h2>Feito para prints, landing pages, banners e materiais leves.</h2>
            <p>
              O foco do Scanlume nao e reconstruir layout pixel por pixel. O objetivo e extrair o texto principal com uma leitura clara para copiar, revisar e reaproveitar rapido.
            </p>
          </div>

          <div className="check-grid">
            <div className="check-card">
              <strong>Simple OCR</strong>
              <p>Ideal para capturas simples, posters, recortes de tela e texto puro de uso rapido.</p>
            </div>
            <div className="check-card">
              <strong>Formatted Text</strong>
              <p>Melhor para paginas, interfaces, criativos, app screens e conteudo que depois vai para Word ou Markdown.</p>
            </div>
            <div className="check-card">
              <strong>Batch ready</strong>
              <p>Lotes de ate 10 imagens com download em ZIP para acelerar tarefas repetidas.</p>
            </div>
            <div className="check-card">
              <strong>SEO-first</strong>
              <p>Paginas em pt-BR, SSR, FAQ e slugs pensados para `imagem para texto` e long tails correlatas.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Paginas relacionadas</p>
            <h2>Use a malha interna para navegar entre intencoes proximas.</h2>
          </div>

          <div className="related-grid">
            {relatedPages.map(([key, entry]) => (
              <Link key={key} href={`/${key}`} className="related-card">
                <span>{entry.eyebrow}</span>
                <strong>{entry.h1}</strong>
                <p>{entry.lead}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">FAQ</p>
            <h2>Perguntas comuns sobre OCR online em pt-BR.</h2>
          </div>
          <FaqList items={homeFaqs} />
        </div>
      </section>
    </>
  );
}
