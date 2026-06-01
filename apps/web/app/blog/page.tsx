import Image from "next/image";
import Link from "next/link";

import { BLOG_PATH, BLOG_POSTS } from "@/lib/blog";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Blog OCR em pt-BR | Testes, comparativos e boas praticas",
  description:
    "Guias praticos do Scanlume sobre OCR em portugues, comparativos entre JPG e PNG, exportacao para Word e Markdown, testes com imagens reais e metodo editorial com revisao explicita.",
  keywords: [
    "ocr em portugues",
    "imagem para texto",
    "jpg para texto",
    "png para texto",
    "ocr word markdown",
  ],
  pathname: BLOG_PATH,
});

export default function BlogIndexPage() {
  return (
    <>
      <section className="tool-first-home">
        <div className="container tool-first-home-inner">
          <div className="tool-first-intro">
            <p className="eyebrow scanlume-signal-label">Blog Scanlume</p>
            <h1>Guias e comparativos</h1>
            <p>
              Testes praticos e playbooks de OCR em portugues para transformar imagem em texto editavel.
            </p>
            <div className="tool-first-pills" aria-label="Temas do blog">
              <span>Benchmarks</span>
              <span>Word e Markdown</span>
              <span>Evidencia real</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container">
          <div className="blog-card-grid">
            {BLOG_POSTS.map((post) => (
              <article key={post.slug} className="blog-card-surface">
                <div className="blog-card-image-shell">
                  <Image src={post.coverImage} alt={post.coverAlt} width={960} height={720} />
                </div>

                <div className="blog-card-copy">
                  <div className="blog-card-meta">
                    <span>{post.category}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                </div>

                <Link href={`${BLOG_PATH}/${post.slug}`} className="ghost-button large-button blog-card-button">
                  Ler artigo
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
