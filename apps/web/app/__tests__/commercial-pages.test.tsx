import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ApiPage, { metadata as apiMetadata } from "@/app/api/page";
import EnglishApiPage, { metadata as englishApiMetadata } from "@/app/en/api/page";
import EnglishPricingPage, { metadata as englishPricingMetadata } from "@/app/en/pricing/page";
import PrecosPage, { metadata as precosMetadata } from "@/app/precos/page";
import sitemap from "@/app/sitemap";

vi.mock("@/lib/account", async () => {
  const actual = await vi.importActual<typeof import("@/lib/account")>("@/lib/account");

  return {
    ...actual,
    fetchAccount: vi.fn().mockResolvedValue({
      viewer: { authenticated: false, user: null },
      currentPlan: { id: "free", label: "Conta gratuita", shortLabel: "Gratis", description: "", priceLabel: "Gratis", isPaid: false, isCurrent: true, comingSoon: false, entitlements: { dailyImages: 100, dailyCredits: 50, maxBatchFiles: 10, maxImageMb: 5, maxBatchTotalMb: 20 }, features: [] },
      usage: { grantedCredits: 50, usedCredits: 0, remainingCredits: 50 },
      usageToday: { usedImages: 0, usedCredits: 0, remainingImages: 100, remainingCredits: 50 },
      billing: { status: "inactive", provider: null, billingEmail: null, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
      waitlist: { joined: false, count: 2, joinedAt: null, canJoin: true },
      availablePlans: [],
      notes: { replyWindow: "", subscriptions: "" },
      api: { remainingCredits: 0, effectiveTier: null, keys: [] },
    }),
  };
});

vi.mock("@/lib/browser-id", () => ({
  getOrCreateBrowserId: () => "browser-123",
}));

afterEach(() => {
  cleanup();
});

describe("Commercial page discovery and schema", () => {
  it("includes /precos and /api in the sitemap", () => {
    const entries = sitemap().map((item) => item.url);

    expect(entries).toContain("https://www.scanlume.com/precos");
    expect(entries).toContain("https://www.scanlume.com/api");
    expect(entries).toContain("https://www.scanlume.com/en/pricing");
    expect(entries).toContain("https://www.scanlume.com/en/api");
  });

  it("exposes Q&A-oriented metadata for pricing and developer pages", () => {
    expect(precosMetadata.title).toContain("Precos");
    expect(precosMetadata.description).toMatch(/perguntas frequentes|FAQ|duvidas|guia/i);
    expect(apiMetadata.title).toContain("API");
    expect(apiMetadata.description).toMatch(/perguntas frequentes|FAQ|integracao|developer/i);
    expect(englishPricingMetadata.title).toContain("pricing");
    expect(englishApiMetadata.description).toMatch(/API key|examples/i);
  });

  it("adds pricing structured data to the pricing page output", () => {
    render(<PrecosPage />);

    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
      (script) => script.textContent ?? "",
    );

    expect(scripts.some((json) => json.includes('"OfferCatalog"') || json.includes('"ItemList"') || json.includes('"Product"'))).toBe(true);
  });

  it("adds developer structured data, FAQ, and breadcrumbs to the API page output", () => {
    render(<ApiPage />);

    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
      (script) => script.textContent ?? "",
    );

    expect(scripts.some((json) => json.includes('"FAQPage"'))).toBe(true);
    expect(scripts.some((json) => json.includes('"BreadcrumbList"'))).toBe(true);
    expect(scripts.some((json) => json.includes('"SoftwareApplication"') || json.includes('"Service"') || json.includes('"WebPage"'))).toBe(true);
  });

  it("surfaces decision-guide internal links on commercial pages", () => {
    render(<ApiPage />);

    expect(document.querySelector('a[href="/blog/quando-usar-ocr-no-navegador-vs-api"]')).not.toBeNull();

    cleanup();
    render(<PrecosPage />);

    expect(document.querySelector('a[href="/blog/quando-usar-ocr-no-navegador-vs-api"]')).not.toBeNull();
    expect(document.querySelector('a[href="/blog/ocr-simples-vs-texto-formatado"]')).not.toBeNull();
  });

  it("keeps pricing support headings in pt-BR", () => {
    render(<PrecosPage />);

    expect(screen.getByRole("heading", { name: /Como os credits funcionam/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Regras de cobranca/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Exemplos da API de OCR para imagem/i })).toBeInTheDocument();
  });

  it("renders English commercial pages without Portuguese primary CTAs", () => {
    render(<EnglishApiPage />);

    expect(screen.getByRole("heading", { name: /Scanlume OCR API/i })).toBeInTheDocument();
    expect(screen.getByText(/optional OCR language/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ver planos/i })).not.toBeInTheDocument();

    cleanup();
    render(<EnglishPricingPage />);

    expect(screen.getByRole("heading", { name: /Simple plans/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /How credits work/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Assinar mensal/i })).not.toBeInTheDocument();
  });
});
