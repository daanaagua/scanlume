import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import sitemap from "@/app/sitemap";

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
    expect(urls).toContain("https://www.scanlume.com/metodo-e-evidencia");
  });

  it("links homepage to methodology guidance", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: /metodo e evidencia/i })).toBeInTheDocument();
  });
});
