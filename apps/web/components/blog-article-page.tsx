import Image from "next/image";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import {
  BLOG_PATH,
  BLOG_EDITORIAL_NAME,
  BLOG_REVIEW_NAME,
  type BlogPost,
  getBlogPost,
  getBlogBreadcrumbJsonLd,
  getBlogFaqJsonLd,
  getBlogPostingJsonLd,
} from "@/lib/blog";
import { EVIDENCE_PATH } from "@/lib/site";

export function BlogArticlePage({ post }: { post: BlogPost }) {
  const relatedPosts = post.relatedPosts
    .map((slug) => getBlogPost(slug))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <>
      <JsonLd data={getBlogPostingJsonLd(post)} />
      <JsonLd data={getBlogBreadcrumbJsonLd(post)} />
      <JsonLd data={getBlogFaqJsonLd(post)} />

      <section className="tool-first-home">
        <div className="container tool-first-home-inner">
          <div className="tool-first-intro">
            <div className="blog-kicker-row">
              <p className="eyebrow scanlume-signal-label">{post.category}</p>
              <span className="blog-meta-pill">{post.readTime}</span>
            </div>
            <h1>{post.title}</h1>
            <p>{post.heroLead}</p>
            <div className="blog-meta-row">
              <span>Autor: {BLOG_EDITORIAL_NAME}</span>
              <span>Revisao: {BLOG_REVIEW_NAME}</span>
              <span>Publicado: {post.publishedAt}</span>
              <span>Revisado: {post.lastReviewedAt}</span>
              <Link href={EVIDENCE_PATH}>Metodo</Link>
            </div>
          </div>

          <div className="hero-actions">
            <Link href="/imagem-para-texto" className="solid-button large-button">
              Testar a ferramenta
            </Link>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container blog-article-layout">
          <aside className="blog-aside-stack">
            <div className="blog-summary-card">
              <p className="card-label">Pontos chave</p>
              <ul className="blog-summary-list">
                {post.summary.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </aside>

          <article className="blog-article-surface">
            <figure className="blog-cover-card">
              <Image src={post.coverImage} alt={post.coverAlt} width={1600} height={1200} priority />
              <figcaption>{post.coverCaption}</figcaption>
            </figure>

            {post.sections.map((section) => (
              <section key={section.heading} className="blog-section-block">
                <div className="blog-section-head">
                  <p className="eyebrow">Insight</p>
                  <h2>{section.heading}</h2>
                  {section.intro ? <p>{section.intro}</p> : null}
                </div>

                <div className="blog-paragraph-stack">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                {section.metrics?.length ? (
                  <div className="blog-metric-grid">
                    {section.metrics.map((metric) => (
                      <article key={`${section.heading}-${metric.label}`} className="blog-metric-card">
                        <span>{metric.label}</span>
                        <strong>{metric.value}</strong>
                        <p>{metric.note}</p>
                      </article>
                    ))}
                  </div>
                ) : null}

                {section.bullets?.length ? (
                  <ul className="blog-bullet-list">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </article>
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container blog-faq-band">
          <div className="section-heading">
            <p className="eyebrow">FAQ</p>
            <h2>Perguntas rapidas</h2>
          </div>

          <div className="faq-list">
            {post.faq.map((item) => (
              <article key={item.question} className="faq-item">
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container blog-related-band">
          <div className="section-heading">
            <p className="eyebrow">Leia a seguir</p>
          </div>

          <div className="related-grid">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.slug}
                href={`${BLOG_PATH}/${relatedPost.slug}`}
                className="related-card blog-related-card"
              >
                <span>{relatedPost.category}</span>
                <strong>{relatedPost.title}</strong>
                <p>{relatedPost.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
