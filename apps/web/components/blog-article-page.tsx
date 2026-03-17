import Image from "next/image";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import {
  BLOG_PATH,
  type BlogPost,
  getBlogPost,
  getBlogBreadcrumbJsonLd,
  getBlogPostingJsonLd,
} from "@/lib/blog";

export function BlogArticlePage({ post }: { post: BlogPost }) {
  const relatedPosts = post.relatedPosts
    .map((slug) => getBlogPost(slug))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <>
      <JsonLd data={getBlogPostingJsonLd(post)} />
      <JsonLd data={getBlogBreadcrumbJsonLd(post)} />

      <section className="hero-section blog-hero-section">
        <div className="container blog-hero-grid">
          <div className="hero-copy blog-hero-copy">
            <div className="blog-kicker-row">
              <p className="eyebrow">{post.category}</p>
              <span className="blog-meta-pill">{post.readTime}</span>
            </div>
            <h1>{post.title}</h1>
            <p className="hero-lead">{post.heroLead}</p>

            <div className="blog-meta-row">
              <span>Publicado em {post.publishedAt}</span>
              <span>Revisado em {post.lastReviewedAt}</span>
              <span>Testado pela equipe Scanlume</span>
              <span>Blog Scanlume</span>
            </div>

            <div className="hero-actions hero-inline-actions">
              <Link href="/imagem-para-texto" className="solid-button large-button">
                Testar a ferramenta
              </Link>
              <Link href={BLOG_PATH} className="ghost-button large-button">
                Ver mais guias
              </Link>
            </div>
          </div>

          <figure className="blog-cover-card">
            <Image src={post.coverImage} alt={post.coverAlt} width={1600} height={1200} priority />
            <figcaption>{post.coverCaption}</figcaption>
          </figure>
        </div>
      </section>

      <section className="section-band">
        <div className="container blog-article-layout">
          <aside className="blog-aside-stack">
            <div className="blog-summary-card">
              <p className="card-label">Leitura guiada</p>
              <h2>O que vale levar deste artigo</h2>
              <ul className="blog-summary-list">
                {post.summary.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="blog-summary-card">
              <p className="card-label">Metodo editorial</p>
              <h2>Como este guia foi preparado</h2>
              <ul className="blog-summary-list">
                {post.editorialMethod.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </aside>

          <article className="blog-article-surface">
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
        <div className="container split-content blog-faq-band">
          <div className="section-heading">
            <p className="eyebrow">FAQ</p>
            <h2>Perguntas rapidas que aparecem depois do OCR.</h2>
            <p>
              O objetivo aqui e reduzir a distancia entre o benchmark, a exportacao e o uso real do texto.
            </p>
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
        <div className="container split-content blog-related-band">
          <div className="section-heading">
            <p className="eyebrow">Leia em seguida</p>
            <h2>Continue no cluster antes de voltar para a ferramenta.</h2>
            <p>
              Estes artigos aprofundam formato, exportacao e cenarios vizinhos para manter a leitura conectada com a
              mesma intencao de OCR.
            </p>
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

      <section className="section-band">
        <div className="container split-content blog-related-band">
          <div className="section-heading">
            <p className="eyebrow">Proximo passo</p>
            <h2>Leve a teoria para um arquivo real.</h2>
            <p>
              Depois do artigo, o melhor caminho e testar o produto com um print, JPG ou PNG do seu proprio fluxo.
            </p>
          </div>

          <div className="related-grid">
            {post.relatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className="related-card blog-related-card">
                <span>{link.label}</span>
                <strong>{link.description}</strong>
                <p>Abrir {link.href}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
