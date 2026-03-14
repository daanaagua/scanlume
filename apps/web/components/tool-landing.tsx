import Link from "next/link";

import { FaqList } from "@/components/faq-list";
import { JsonLd } from "@/components/json-ld";
import { OcrWorkspace } from "@/components/ocr-workspace";
import {
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
          mainEntity: page.faq.map((item) => ({
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
              {page.heroBullets.map((item) => (
                <span key={item}>{item}</span>
              ))}
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
          <OcrWorkspace defaultMode={page.defaultMode ?? "simple"} />
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container split-content">
          <div>
            <p className="eyebrow">Quando usar</p>
            <h2>{page.useCasesHeading}</h2>
            <p>{page.useCasesLead}</p>
          </div>

          <div className="check-grid">
            {page.useCases.map((item) => (
              <div key={item.title} className="check-card">
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Como funciona</p>
            <h2>{page.stepsHeading}</h2>
            <p>{page.stepsLead}</p>
          </div>

          <div className="timeline-grid">
            {page.steps.map((item, index) => (
              <article key={item.title} className="timeline-step">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band muted-band">
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
            <h2>{page.faqHeading}</h2>
          </div>
          <FaqList items={page.faq} />
        </div>
      </section>
    </>
  );
}
