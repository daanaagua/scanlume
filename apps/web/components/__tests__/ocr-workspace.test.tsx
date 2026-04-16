import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OcrWorkspace } from "@/components/ocr-workspace";

vi.mock("@/lib/pdf-renderer", async () => {
  const actual = await vi.importActual<typeof import("@/lib/pdf-renderer")>("@/lib/pdf-renderer");

  return {
    ...actual,
    readPdfPageCount: vi.fn(async () => 1),
    buildPreparedPdfPages: vi.fn(async () => [
      {
        pageNumber: 1,
        source: "mixed" as const,
        width: 1200,
        height: 1600,
        nativeTextBlocks: [{ text: "Titulo nativo", bbox: { x: 120, y: 80, width: 240, height: 48 } }],
        ocrRegions: [
          { id: "page-1-region-1", imageBase64: "region-1", bbox: { x: 80, y: 220, width: 320, height: 220 } },
          { id: "page-1-region-2", imageBase64: "region-2", bbox: { x: 720, y: 940, width: 260, height: 180 } },
        ],
      },
    ]),
  };
});

vi.mock("@/lib/browser-id", () => ({
  getOrCreateBrowserId: () => "browser-id-test",
}));

const authenticatedLimitsResponse = {
  viewer: {
    authenticated: true,
    type: "user" as const,
    user: null,
  },
  plan: {
    id: "free",
    label: "Conta gratuita",
    shortLabel: "Gratis",
  },
  limits: {
    dailyImages: 100,
    dailyCredits: 50,
    maxImageMb: 5,
    maxBatchFiles: 10,
    maxBatchTotalMb: 20,
    softBudgetRmb: 18,
    hardBudgetRmb: 20,
    pdf: {
      maxFileMb: 15,
      maxPagesPerDocument: 50,
      requestPageLimitAnonymous: 5,
      dailyPageLimitLoggedIn: 25,
      remainingPages: 25,
    },
  },
  budget: {
    totalCostRmb: 0,
  },
  usage: {
    usedImages: 0,
    usedCredits: 0,
    remainingImages: 100,
    remainingCredits: 50,
  },
  status: {
    softStopped: false,
    hardStopped: false,
  },
};

beforeEach(() => {
  Object.defineProperty(URL, "createObjectURL", {
    writable: true,
    value: vi.fn(() => "blob:scanlume-test"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    writable: true,
    value: vi.fn(),
  });

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/v1/limits")) {
        return {
          ok: true,
          json: async () => authenticatedLimitsResponse,
        };
      }

      if (url.includes("/v1/pdf/ocr")) {
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              kind: "pdf",
              totalPages: 1,
              processedPages: 1,
              lockedPages: 0,
              html: "<p>Conteudo OCR</p>",
              md: "Conteudo OCR",
              txt: "Conteudo OCR",
              previewHtml: "<p>Conteudo OCR</p>",
              remainingPdfPagesToday: 24,
              exportToken: "token-1",
              exportManifest: { id: "manifest-1" },
              pageStats: {
                textLayerPages: 0,
                ocrPages: 0,
                mixedPages: 1,
              },
              tableStats: {
                tableBlocks: 1,
                rowGroups: 1,
                extractedRecords: 2,
              },
              failedPages: [],
            }),
        };
      }

      if (url.includes("/v1/ocr")) {
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              result: {
                kind: "image",
                txt: "Resumo de vendas\nFrutas | 20.00",
                md: "| Categoria | Amount |\n| --- | --- |\n| Frutas | 20.00 |",
                html: "<section><table><thead><tr><th>Categoria</th><th>Amount</th></tr></thead><tbody><tr><td>Frutas</td><td>20.00</td></tr></tbody></table></section>",
                preview: "<section><table><thead><tr><th>Categoria</th><th>Amount</th></tr></thead><tbody><tr><td>Frutas</td><td>20.00</td></tr></tbody></table></section>",
                tableSummary: {
                  tableCount: 1,
                  rowGroupCount: 1,
                  recordCount: 2,
                },
              },
            }),
        };
      }

      throw new Error(`Unhandled fetch in test: ${url}`);
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("OcrWorkspace", () => {
  it("shows images-only guidance in OCR simples mode", () => {
    render(<OcrWorkspace defaultMode="simple" priorityLayout />);

    expect(screen.getByText(/ocr simples aceita apenas imagens/i)).not.toBeNull();
  });

  it("accepts PDFs only in Texto formatado mode", async () => {
    const user = userEvent.setup();
    render(<OcrWorkspace defaultMode="simple" priorityLayout />);

    const input = document.querySelector("#scanlume-upload") as HTMLInputElement;
    expect(input).toHaveAttribute("accept", "image/*");

    await user.click(screen.getAllByRole("button", { name: /texto formatado/i })[0]);
    expect(input).toHaveAttribute("accept", "image/*,application/pdf");
  });

  it("shows unified total credits instead of a PDF page quota card", async () => {
    render(<OcrWorkspace defaultMode="formatted" priorityLayout />);

    expect(await screen.findByText("50 / 50")).not.toBeNull();
    expect(screen.getByText(/pdf = 2 credits por pagina/i)).not.toBeNull();
    expect(screen.queryByText("Paginas PDF")).toBeNull();
  });

  it("explains mixed PDF pages without showing misleading zero-only stat labels", async () => {
    const user = userEvent.setup();
    render(<OcrWorkspace defaultMode="formatted" priorityLayout />);

    const input = document.querySelector("#scanlume-upload") as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], "mixed.pdf", { type: "application/pdf" });
    await user.upload(input, file);
    await user.click(screen.getByRole("button", { name: /iniciar texto formatado/i }));

    expect(await screen.findByText(/1 pagina mista: texto nativo \+ OCR em regioes/i)).not.toBeNull();
    expect(screen.getByText(/pdf pesquisavel preserva a pagina original/i)).not.toBeNull();
    expect(screen.getByText(/pdf reorganizado recompae o conteudo para leitura continua/i)).not.toBeNull();
    expect(screen.queryByText(/texto nativo: 0/i)).toBeNull();
    expect(screen.queryByText(/^OCR: 0$/i)).toBeNull();
    expect(screen.queryByText(/misto: 1/i)).toBeNull();
  });

  it("shows table-aware guidance and result summary for formatted image OCR", async () => {
    const user = userEvent.setup();
    render(<OcrWorkspace defaultMode="formatted" priorityLayout />);

    expect(screen.getByText(/tabelas e blocos complexos/i)).not.toBeNull();

    const input = document.querySelector("#scanlume-upload") as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], "sales-table.png", { type: "image/png" });
    await user.upload(input, file);
    await user.click(screen.getByRole("button", { name: /iniciar texto formatado/i }));

    expect(await screen.findByText(/1 tabela detectada/i)).not.toBeNull();
    expect(screen.getByText(/2 registros extraidos/i)).not.toBeNull();
  });
});
