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
    render(<Home />);

    expect(screen.getAllByText(/PDF para texto/i).length).toBeGreaterThan(0);
  });

  it("shows PDF-specific explanatory copy on workspace-first PDF pages", () => {
    render(<ToolLanding slug="pdf-para-texto" />);

    expect(screen.getAllByText(/pdfs com texto nativo, paginas escaneadas e layouts mistos/i).length).toBeGreaterThan(0);
  });

  it("mentions PDF support from the imagem-para-texto long-form page", () => {
    render(<ImageToTextPage />);

    expect(screen.getAllByText(/PDF para texto/i).length).toBeGreaterThan(0);
  });
});
