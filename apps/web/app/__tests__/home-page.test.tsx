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
    expect(container.querySelector(".tool-first-home")).not.toBeNull();
    expect(container.querySelector(".hero-grid")).toBeNull();
    expect(container.querySelector(".split-content")).toBeNull();
  });

  it("shows PDF-specific explanatory copy below a tool-first workspace", () => {
    const { container } = render(<ToolLanding slug="pdf-para-texto" />);

    expect(container.querySelector(".tool-first-landing")).not.toBeNull();
    expect(container.querySelector(".tool-first-workspace")).not.toBeNull();
    expect(container.querySelector(".command-hero")).toBeNull();
    expect(screen.getByTestId("ocr-workspace")).toBeInTheDocument();
    expect(container.querySelector(".hero-grid")).toBeNull();
    expect(container.querySelector(".split-content")).toBeNull();
    expect(screen.getAllByText(/pdfs com texto nativo, paginas escaneadas e layouts mistos/i).length).toBeGreaterThan(0);
  });

  it("mentions PDF support from the imagem-para-texto long-form page", () => {
    render(<ImageToTextPage />);

    expect(screen.getAllByText(/PDF para texto/i).length).toBeGreaterThan(0);
  });

  it("puts the real OCR workspace in the first homepage screen", () => {
    const { container } = render(<Home />);

    expect(container.querySelector(".tool-first-home")).not.toBeNull();
    expect(container.querySelector(".scanlume-hero-stage")).toBeNull();
    expect(container.querySelector(".scanlume-workflow-strip")).toBeNull();
    expect(container.querySelector(".command-hero-card")).toBeNull();
    expect(screen.getByTestId("ocr-workspace")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /abrir a ferramenta/i })).toBeNull();
  });
});
