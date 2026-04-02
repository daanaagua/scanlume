import Link from "next/link";

import { FaqList } from "@/components/faq-list";
import { JsonLd } from "@/components/json-ld";
import { OcrWorkspace } from "@/components/ocr-workspace";
import { BLOG_POSTS, BLOG_PATH } from "@/lib/blog";
import {
  FORMATTED_MODE_LABEL,
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
  const heroLead = workspaceFirst
    ? isPdfWorkspace
      ? "O workspace principal ja fica no topo. Aqui embaixo voce encontra o contexto do fluxo PDF: texto nativo quando existe, OCR por regiao quando a pagina e imagem, e saida em PDF pesquisavel ou reorganizado."
      : "A ferramenta principal ja fica no topo. Aqui embaixo voce so precisa decidir entre velocidade e estrutura antes de processar a imagem."
    : page.lead;
  const heroBullets = workspaceFirst
    ? isPdfWorkspace
      ? ["PDF nativo, escaneado ou misto", "PDF pesquisavel e reorganizado", "HTML, Markdown e TXT"]
      : ["JPG, PNG e screenshot", "Texto puro ou organizado", "Copiar e baixar no navegador"]
    : page.heroBullets;
  const heroPrimaryLabel = workspaceFirst ? "Voltar ao upload" : "Usar agora";
  const heroActionNote = workspaceFirst
    ? isPdfWorkspace
      ? "Use este bloco para entender quando o PDF fica melhor em Texto formatado, como os downloads funcionam e o que muda entre PDF pesquisavel e PDF reorganizado."
      : "Use este bloco para comparar os dois modos sem perder o foco no upload."
    : "Teste gratis direto no navegador";
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
    <section id={OCR_WORKSPACE_ID} className={`section-band tool-workspace-band${workspaceFirst ? " is-priority" : ""}`}>
      <div className="container">
        <OcrWorkspace defaultMode={page.defaultMode ?? "simple"} priorityLayout={workspaceFirst} />
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

      {workspaceFirst ? workspaceSection : null}

      <section className={`hero-section${workspaceFirst ? " hero-section-compact" : ""}`}>
        <div className={`container hero-grid${workspaceFirst ? " hero-grid-compact" : ""}`}>
          <div className={`hero-copy${workspaceFirst ? " hero-copy-compact" : ""}`}>
            <p className="eyebrow">{heroEyebrow}</p>
            <h1>{page.h1}</h1>
            <p className="hero-lead">{heroLead}</p>
            <div className="hero-actions hero-inline-actions">
              <a href={`#${OCR_WORKSPACE_ID}`} className="solid-button large-button hero-primary-cta">
                {heroPrimaryLabel}
              </a>
              <span className="hero-action-note">{heroActionNote}</span>
            </div>
            <div className="hero-bullets">
              {heroBullets.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          <div className={`hero-card editorial-card${workspaceFirst ? " hero-card-compact" : ""}`}>
            <div>
              <p className="card-label">{workspaceFirst ? "Se quer velocidade" : "Modo rapido"}</p>
              <h2>{SIMPLE_MODE_LABEL}</h2>
              <p>
                {workspaceFirst
                  ? isPdfWorkspace
                    ? "Continua melhor para imagens soltas. PDFs ficam restritos ao modo Texto formatado porque exigem reconstruir estrutura e layout."
                    : "Melhor para extrair texto puro com menos espera em screenshots, posters e fotos simples."
                  : "Texto puro, sem raciocinio extra, mais veloz para screenshot, poster e foto do celular."}
              </p>
            </div>
            <div>
              <p className="card-label">{workspaceFirst ? "Se quer leitura melhor" : "Modo estruturado"}</p>
              <h2>{FORMATTED_MODE_LABEL}</h2>
              <p>
                {workspaceFirst
                  ? isPdfWorkspace
                    ? "E o modo que libera PDF no Scanlume: reaproveita texto nativo, aplica OCR nas regioes em imagem e agora reconstrui melhor o texto dentro do espaco original do PDF."
                    : "Vale usar quando voce quer manter titulos, paragrafos e uma hierarquia mais limpa para revisar depois."
                  : "Preserva a estrutura principal com titulos, paragrafos e uma leitura mais clara."}
              </p>
            </div>
            <a href={`#${OCR_WORKSPACE_ID}`} className="solid-button large-button">
              {workspaceFirst ? (isPdfWorkspace ? "Subir PDF" : "Subir imagem") : "Teste gratis agora"}
            </a>
          </div>
        </div>
      </section>

      {workspaceFirst ? null : workspaceSection}

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
        <div className="container split-content blog-faq-band">
          <div className="section-heading">
            <p className="eyebrow">Rotas complementares</p>
            <h2>Use links mais proximos da intencao para reforcar a pagina certa.</h2>
            <p>
              Cada atalho abaixo cobre um recorte diferente do mesmo problema e ajuda a concentrar a navegacao entre
              formato, idioma, contexto de uso e destino final do texto.
            </p>
          </div>

          <div className="faq-list">
            {page.contextualLinks.map((item) => (
              <article key={item.href} className="faq-item">
                <strong>
                  <Link href={item.href}>{item.label}</Link>
                </strong>
                <p>{item.body}</p>
              </article>
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
            <h2>Continue por paginas de apoio sem dispersar a rota principal.</h2>
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

      <section className="section-band">
        <div className="container split-content blog-related-band">
          <div className="section-heading">
            <p className="eyebrow">Do blog</p>
            <h2>Quer contexto antes do upload? Leia os guias de OCR.</h2>
            <p>
              Publicamos comparativos, benchmarks e updates de produto para explicar quando o OCR funciona melhor, quando usar PDF no modo formatado e como escolher a exportacao certa.
            </p>
            <div className="hero-actions">
              <Link href={BLOG_PATH} className="ghost-button large-button">
                Abrir blog
              </Link>
            </div>
          </div>

          <div className="related-grid">
            {featuredPosts.map((post) => (
              <Link key={post.slug} href={`${BLOG_PATH}/${post.slug}`} className="related-card blog-related-card">
                <span>{post.category}</span>
                <strong>{post.title}</strong>
                <p>{post.excerpt}</p>
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
