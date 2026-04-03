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
    dailyCredits: 100,
    maxImageMb: 5,
    maxBatchFiles: 10,
    maxBatchTotalMb: 20,
    softBudgetRmb: 18,
    hardBudgetRmb: 20,
    pdf: {
      maxFileMb: 15,
      maxPagesPerDocument: 50,
      requestPageLimitAnonymous: 5,
      dailyPageLimitLoggedIn: 20,
      remainingPages: 19,
    },
  },
  budget: {
    totalCostRmb: 0,
  },
  usage: {
    usedImages: 0,
    usedCredits: 0,
    remainingImages: 100,
    remainingCredits: 100,
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

  it("shows the authenticated PDF page quota in formatted mode", async () => {
    render(<OcrWorkspace defaultMode="formatted" priorityLayout />);

    expect(await screen.findByText("Paginas PDF")).not.toBeNull();
    expect(screen.getByText("19 / 20")).not.toBeNull();
    expect(screen.getByText(/pdf desconta paginas da cota diaria/i)).not.toBeNull();
  });
});
