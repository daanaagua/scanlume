import Image from "next/image";
import Link from "next/link";

import { BLOG_PATH, BLOG_POSTS } from "@/lib/blog";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Blog OCR em pt-BR | Testes, comparativos e boas praticas",
  description:
    "Guias praticos do Scanlume sobre OCR em portugues, comparativos entre JPG e PNG, exportacao para Word e Markdown e testes com imagens reais.",
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
      <section className="hero-section blog-hub-hero">
        <div className="container split-content blog-hub-shell">
          <div className="hero-copy blog-hub-copy">
            <p className="eyebrow">Blog Scanlume</p>
            <h1>Testes reais, comparativos e playbooks para OCR em pt-BR.</h1>
            <p className="hero-lead">
              Em vez de publicar posts genericos, reunimos benchmark visual, decisoes de formato e rotas de exportacao que ajudam a transformar imagem em texto utilizavel.
            </p>
            <div className="hero-bullets">
              <span>Benchmarks visuais</span>
              <span>Comparativos praticos</span>
              <span>Fluxos para Word e Markdown</span>
            </div>
          </div>

          <div className="hero-card blog-hub-card">
            <p className="card-label">Recorte editorial</p>
            <h2>Conteudo desenhado para ajudar a indexar melhor e explicar melhor.</h2>
            <p>
              Cada artigo nasce de um caso concreto: screenshot com layout misto, diferenca entre formatos e exportacao do OCR para o uso final.
            </p>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Artigos</p>
            <h2>Uma base inicial de conteudo para apoiar imagem para texto.</h2>
            <p>
              Os posts abaixo foram escritos para responder duvidas que aparecem antes e depois do upload: qualidade da imagem, escolha do formato e destino do texto exportado.
            </p>
          </div>

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
