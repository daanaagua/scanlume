import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import ImageToTextPage from "@/app/imagem-para-texto/page";
import { ToolLanding } from "@/components/tool-landing";

vi.mock("@/components/ocr-workspace", () => ({
  OcrWorkspace: () => <div data-testid="ocr-workspace" />,
}));

afterEach(() => {
  cleanup();
});

describe("Home and product surfacing", () => {
  it("surfaces PDF para texto among homepage route cards", () => {
    const { container } = render(<Home />);

    expect(screen.getAllByText(/PDF para texto/i).length).toBeGreaterThan(0);
    expect(container.querySelector(".command-hero")).not.toBeNull();
    expect(container.querySelector(".hero-grid")).toBeNull();
    expect(container.querySelector(".split-content")).toBeNull();
  });

  it("shows PDF-specific explanatory copy on workspace-first PDF pages", () => {
    const { container } = render(<ToolLanding slug="pdf-para-texto" />);

    expect(screen.getAllByText(/pdfs com texto nativo, paginas escaneadas e layouts mistos/i).length).toBeGreaterThan(0);
    expect(container.querySelector(".command-hero")).not.toBeNull();
    expect(container.querySelector(".hero-grid")).toBeNull();
    expect(container.querySelector(".split-content")).toBeNull();
  });

  it("mentions PDF support from the imagem-para-texto long-form page", () => {
    render(<ImageToTextPage />);

    expect(screen.getAllByText(/PDF para texto/i).length).toBeGreaterThan(0);
  });
});
