import { cleanup, render } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { BlogArticlePage } from "@/components/blog-article-page";
import { getBlogPostingJsonLd, getBlogPost } from "@/lib/blog";

afterEach(() => {
  cleanup();
});

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

  it("renders FAQPage structured data matching article FAQ content", () => {
    const post = getBlogPost("ocr-simples-vs-texto-formatado");

    expect(post).toBeDefined();

    render(createElement(BlogArticlePage, { post: post! }));

    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
      (script) => script.textContent ?? "",
    );

    expect(scripts.some((json) => json.includes('"@type":"FAQPage"'))).toBe(true);
    expect(scripts.some((json) => json.includes(post!.faq[0].question))).toBe(true);
  });
});
