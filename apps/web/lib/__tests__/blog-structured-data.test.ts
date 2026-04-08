import { describe, expect, it } from "vitest";

import { getBlogPostingJsonLd, getBlogPost } from "@/lib/blog";

describe("blog structured data", () => {
  it("adds editorial context for GEO-friendly article citations", () => {
    const post = getBlogPost("ocr-portugues-imagem-para-texto-teste-real");

    expect(post).toBeDefined();

    const jsonLd = getBlogPostingJsonLd(post!);

    expect(jsonLd.author).toMatchObject({
      "@type": "Organization",
      name: "Equipe editorial Scanlume",
    });
    expect(jsonLd.editor).toBe("Revisao editorial Scanlume");
    expect(jsonLd.citation).toBe("https://www.scanlume.com/metodo-e-evidencia");
    expect(jsonLd.isPartOf).toMatchObject({
      "@type": "Blog",
      name: "Blog Scanlume",
    });
    expect(jsonLd.about).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "Thing",
          name: "OCR em pt-BR",
        }),
        expect.objectContaining({
          "@type": "Thing",
          name: "Metodo editorial e revisao humana",
        }),
      ]),
    );
  });
});
