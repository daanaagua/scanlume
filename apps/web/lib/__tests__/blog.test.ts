import { describe, expect, it } from "vitest";

import { getBlogPost, getBlogPostingJsonLd } from "@/lib/blog";

describe("blog release notes", () => {
  it("contains the PDF layout reconstruction release post with links back to PDF routes", () => {
    expect(getBlogPost("pdf-layout-reconstruction-update")?.relatedLinks).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: "/pdf-para-texto" })]),
    );
  });

  it("publishes author and review signals in the blog posting schema", () => {
    const post = getBlogPost("pdf-layout-reconstruction-update");

    expect(getBlogPostingJsonLd(post as NonNullable<typeof post>)).toEqual(
      expect.objectContaining({
        author: expect.objectContaining({ name: "Equipe editorial Scanlume" }),
        editor: "Revisao editorial Scanlume",
        citation: "https://www.scanlume.com/metodo-e-evidencia",
      }),
    );
  });

  it("publishes decision guides for mode, medium and integration choice", () => {
    expect(getBlogPost("ocr-simples-vs-texto-formatado")).toEqual(
      expect.objectContaining({
        slug: "ocr-simples-vs-texto-formatado",
        relatedLinks: expect.arrayContaining([
          expect.objectContaining({ href: "/imagem-para-texto" }),
          expect.objectContaining({ href: "/imagem-para-word" }),
        ]),
      }),
    );

    expect(getBlogPost("ocr-imagem-vs-pdf-diferencas-praticas")).toEqual(
      expect.objectContaining({
        slug: "ocr-imagem-vs-pdf-diferencas-praticas",
        relatedLinks: expect.arrayContaining([
          expect.objectContaining({ href: "/pdf-para-texto" }),
          expect.objectContaining({ href: "/imagem-para-texto" }),
        ]),
      }),
    );

    expect(getBlogPost("quando-usar-ocr-no-navegador-vs-api")).toEqual(
      expect.objectContaining({
        slug: "quando-usar-ocr-no-navegador-vs-api",
        relatedLinks: expect.arrayContaining([
          expect.objectContaining({ href: "/api" }),
          expect.objectContaining({ href: "/ocr-online" }),
        ]),
      }),
    );
  });

  it("cross-links the new decision guides into the existing cluster", () => {
    expect(getBlogPost("comparativo-jpg-png-print-ocr")?.relatedPosts).toEqual(
      expect.arrayContaining(["ocr-simples-vs-texto-formatado"]),
    );

    expect(getBlogPost("pdf-layout-reconstruction-update")?.relatedPosts).toEqual(
      expect.arrayContaining(["ocr-imagem-vs-pdf-diferencas-praticas"]),
    );

    expect(getBlogPost("exportar-ocr-word-markdown-boas-praticas")?.relatedPosts).toEqual(
      expect.arrayContaining(["quando-usar-ocr-no-navegador-vs-api"]),
    );
  });
});
