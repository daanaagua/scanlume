import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import EnglishHome from "@/app/en/page";
import EnglishImageToTextPage from "@/app/en/image-to-text/page";
import sitemap from "@/app/sitemap";
import { BLOG_POSTS } from "@/lib/blog";
import { getLlmsFullTxt, getLlmsTxt } from "@/lib/llms";
import { toolPageContent } from "@/lib/site";

vi.mock("@/components/ocr-workspace", () => ({
  OcrWorkspace: () => <div data-testid="ocr-workspace" />,
}));

afterEach(() => {
  cleanup();
});

describe("SEO and GEO foundations", () => {
  it("includes commercial and methodology routes in sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://www.scanlume.com/precos");
    expect(urls).toContain("https://www.scanlume.com/api");
    expect(urls).toContain("https://www.scanlume.com/en");
    expect(urls).toContain("https://www.scanlume.com/en/image-to-text");
    expect(urls).toContain("https://www.scanlume.com/metodo-e-evidencia");
  });

  it("links homepage to methodology guidance", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: /metodo e evidencia/i })).toBeInTheDocument();
  });

  it("renders English entry pages with English-first copy", () => {
    render(<EnglishHome />);

    expect(screen.getByRole("heading", { name: /Online OCR for images and PDF/i })).toBeInTheDocument();
    expect(screen.queryByText(/OCR online em pt-BR/i)).not.toBeInTheDocument();

    cleanup();
    render(<EnglishImageToTextPage />);

    expect(screen.getByRole("heading", { name: /Convert image to text online/i })).toBeInTheDocument();
    expect(screen.getByText(/Edit before export/i)).toBeInTheDocument();
  });

  it("uses stable reviewed dates in the sitemap instead of build-time dates", () => {
    const urls = sitemap();

    expect(urls.find((entry) => entry.url === "https://www.scanlume.com/imagem-para-texto")?.lastModified).toEqual(
      new Date("2026-04-24"),
    );
    expect(
      urls.find((entry) => entry.url === "https://www.scanlume.com/blog/ocr-portugues-imagem-para-texto-teste-real")
        ?.lastModified,
    ).toEqual(new Date("2026-03-17"));
  });

  it("keeps indexable SEO titles and descriptions within SERP-friendly lengths", () => {
    const indexableToolPages = Object.values(toolPageContent).filter((entry) => entry.index !== false);

    for (const page of indexableToolPages) {
      expect(page.title.length, `${page.title} title length`).toBeLessThanOrEqual(60);
      expect(page.description.length, `${page.title} description length`).toBeLessThanOrEqual(160);
    }

    for (const post of BLOG_POSTS) {
      expect(post.title.length, `${post.slug} title length`).toBeLessThanOrEqual(60);
      expect(post.description.length, `${post.slug} description length`).toBeLessThanOrEqual(160);
    }
  });

  it("exposes commercial and PDF capabilities in llms files", () => {
    expect(getLlmsTxt()).toContain("Precos");
    expect(getLlmsTxt()).toContain("API do Scanlume");
    expect(getLlmsFullTxt()).toContain("PDF pesquisavel");
    expect(getLlmsFullTxt()).toContain("PDF reorganizado");
  });
});
