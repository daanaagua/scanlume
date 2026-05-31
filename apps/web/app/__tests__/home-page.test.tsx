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
    expect(container.querySelector(".scanlume-hero-shell")).not.toBeNull();
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

  it("uses the optical desk refresh structure without losing the primary OCR workspace", () => {
    const { container } = render(<Home />);

    expect(container.querySelector(".scanlume-hero-shell")).not.toBeNull();
    expect(container.querySelector(".scanlume-hero-stage")).not.toBeNull();
    expect(container.querySelector(".scanlume-workflow-strip")).not.toBeNull();
    expect(container.querySelector(".command-hero-card")).toBeNull();
    expect(screen.getByTestId("ocr-workspace")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /abrir a ferramenta/i })).toHaveAttribute("href", "/imagem-para-texto");
  });
});
