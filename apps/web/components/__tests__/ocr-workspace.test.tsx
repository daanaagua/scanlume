import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "@testing-library/react";
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
});
