import Link from "next/link";

import { FaqList } from "@/components/faq-list";
import { JsonLd } from "@/components/json-ld";
import { OcrWorkspace } from "@/components/ocr-workspace";
import { BLOG_POSTS, BLOG_PATH } from "@/lib/blog";
import {
  FORMATTED_MODE_LABEL,
  EVIDENCE_PATH,
  OCR_WORKSPACE_ID,
  SITE_NAME,
  SITE_URL,
  SIMPLE_MODE_LABEL,
  toolPageContent,
  type ToolPageSlug,
} from "@/lib/site";

export function ToolLanding({ slug }: { slug: ToolPageSlug }) {
  const page = toolPageContent[slug];
  const workspaceFirst = "workspaceFirst" in page && Boolean(page.workspaceFirst);
  const isPdfWorkspace = slug === "pdf-para-texto";
  const heroEyebrow = workspaceFirst ? (isPdfWorkspace ? page.eyebrow : "Apoio rapido") : page.eyebrow;
  const toolFirstLead = isPdfWorkspace
    ? "Envie PDF nativo, escaneado ou misto e baixe texto ou PDF pesquisavel."
    : page.defaultMode === "formatted"
      ? "Envie imagem ou PDF e gere texto organizado para Word, Markdown, HTML ou PDF."
      : "Envie JPG, PNG ou screenshot e extraia texto editavel no navegador.";
  const heroBullets = workspaceFirst
    ? isPdfWorkspace
      ? ["PDF nativo, escaneado ou misto", "PDF pesquisavel e reorganizado", "HTML, Markdown e TXT"]
      : ["JPG, PNG e screenshot", "Texto puro ou organizado", "Copiar e baixar no navegador"]
    : page.heroBullets;
  const relatedPages = page.relatedSlugs.flatMap((key) => {
    const relatedSlug = key as ToolPageSlug;
    const entry = toolPageContent[relatedSlug];

    if (!entry || relatedSlug === slug) {
      return [];
    }

    return [[relatedSlug, entry] as const];
  });
  const canonical = `${SITE_URL}/${slug}`;
  const featuredPosts = BLOG_POSTS.slice(0, 3);
  const workspaceSection = (
    <section id={OCR_WORKSPACE_ID} className="tool-first-landing">
      <div className="container tool-first-landing-inner">
        <div className="tool-first-intro tool-first-intro-compact">
          <p className="eyebrow">{heroEyebrow}</p>
          <h1>{page.h1}</h1>
          <p>{toolFirstLead}</p>
          <div className="tool-first-pills" aria-label="Recursos desta ferramenta">
            {heroBullets.slice(0, 3).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="tool-first-workspace">
          <OcrWorkspace defaultMode={page.defaultMode ?? "simple"} priorityLayout />
        </div>
      </div>
    </section>
  );

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
            `${SIMPLE_MODE_LABEL} para texto puro`,
            `${FORMATTED_MODE_LABEL} com estrutura principal preservada`,
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

      {workspaceSection}

      <section className="tool-helper-section">
        <div className="container">
          <div className="tool-helper-grid">
            <div className="tool-helper-col">
              <article className="helper-card">
                <div className="helper-card-header">
                  <span className="helper-eyebrow">Como funciona</span>
                  <h2>{page.stepsHeading}</h2>
                  <p className="helper-lead">{page.stepsLead}</p>
                </div>
                <div className="helper-timeline">
                  {page.steps.map((item, index) => (
                    <div key={item.title} className="helper-timeline-item">
                      <span className="timeline-number">{String(index + 1).padStart(2, "0")}</span>
                      <div className="timeline-content">
                        <strong>{item.title}</strong>
                        <p>{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="helper-card">
                <div className="helper-card-header">
                  <span className="helper-eyebrow">Quando usar</span>
                  <h2>{page.useCasesHeading}</h2>
                  <p className="helper-lead">{page.useCasesLead}</p>
                </div>
                <div className="helper-usecases-grid">
                  {page.useCases.map((item) => (
                    <div key={item.title} className="helper-usecase-item">
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="tool-helper-col">
              <article className="helper-card">
                <div className="helper-card-header">
                  <span className="helper-eyebrow">FAQ</span>
                  <h2>{page.faqHeading}</h2>
                </div>
                <div className="helper-faq-wrapper">
                  <FaqList items={page.faq} />
                </div>
              </article>
            </div>
          </div>

          <div className="tool-resources-panel">
            <div className="resources-header">
              <span className="helper-eyebrow">Navegacao e Apoio</span>
              <h2>Recursos complementares de OCR</h2>
            </div>

            <div className="resources-grid">
              <div className="resources-col">
                <h3>Rotas complementares</h3>
                <div className="resources-links">
                  {page.contextualLinks.map((item) => (
                    <article key={item.href} className="resource-link-item">
                      <Link href={item.href} className="resource-link-title">
                        {item.label}
                      </Link>
                      <p className="resource-link-desc">{item.body}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="resources-col">
                <h3>Paginas relacionadas</h3>
                <div className="resources-links">
                  {relatedPages.map(([key, entry]) => (
                    <article key={key} className="resource-link-item">
                      <Link href={`/${key}`} className="resource-link-title">
                        {entry.h1}
                      </Link>
                      <p className="resource-link-desc">{entry.lead}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="resources-col">
                <h3>Do blog</h3>
                <div className="resources-links">
                  {featuredPosts.map((post) => (
                    <article key={post.slug} className="resource-link-item">
                      <Link href={`${BLOG_PATH}/${post.slug}`} className="resource-link-title">
                        {post.title}
                      </Link>
                      <p className="resource-link-desc">{post.excerpt}</p>
                    </article>
                  ))}
                  <div className="blog-extra-info">
                    <p className="resource-link-desc">
                      A pagina de <Link href={EVIDENCE_PATH}>metodo e evidencia</Link> resume como validamos os exemplos.
                    </p>
                    <Link href={BLOG_PATH} className="blog-compact-link">
                      Abrir blog completo &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
