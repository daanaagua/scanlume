import userEvent from "@testing-library/user-event";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OcrWorkspace } from "@/components/ocr-workspace";

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
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: async () => authenticatedLimitsResponse,
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("OcrWorkspace", () => {
  it("keeps images-only upload compact in OCR simples mode", () => {
    render(<OcrWorkspace defaultMode="simple" priorityLayout />);

    const input = document.querySelector("#scanlume-upload") as HTMLInputElement;
    expect(input).toHaveAttribute("accept", "image/*");
    expect(screen.getByText(/solte imagens/i)).not.toBeNull();
    expect(screen.queryByText(/ocr simples aceita apenas imagens/i)).toBeNull();
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

  it("uses the command desk layout with upload, scan, and output in one field of view", async () => {
    const { container } = render(<OcrWorkspace defaultMode="simple" priorityLayout />);

    expect(await screen.findByText(/Upload rapido/i)).not.toBeNull();
    expect(screen.getByLabelText(/Leitura OCR ao vivo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preview do resultado/i)).toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveClass("workspace-desk-grid");
  });

  it("keeps the upload entry compact by moving long guidance out of the upload column", async () => {
    render(<OcrWorkspace defaultMode="simple" priorityLayout />);

    const uploadRegion = screen.getByRole("region", { name: /entrada de arquivos/i });
    expect(within(uploadRegion).queryByText(/Como calculamos o teste gratis/i)).toBeNull();
    expect(within(uploadRegion).queryByText(/Abra JPG, PNG, screenshots/i)).toBeNull();
    expect(within(uploadRegion).queryByText(/Hoje \/ limite/i)).toBeNull();
    expect(await screen.findByText(/Hoje \/ limite/i)).not.toBeNull();
  });

  it("uses the optical desk workspace frame while preserving upload scan and result regions", async () => {
    const { container } = render(<OcrWorkspace defaultMode="simple" priorityLayout />);

    expect(await screen.findByText(/Upload rapido/i)).not.toBeNull();
    expect(container.querySelector(".ocr-desk-shell")).not.toBeNull();
    expect(container.querySelector(".ocr-tool-first-shell")).not.toBeNull();
    expect(container.querySelector(".ocr-desk-command-bar")).not.toBeNull();
    expect(container.querySelector('img[src*="scanlume-ocr-desk.png"]')).toBeNull();
    expect(screen.getByRole("region", { name: /entrada de arquivos/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Leitura OCR ao vivo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preview do resultado/i)).toBeInTheDocument();
  });
});
