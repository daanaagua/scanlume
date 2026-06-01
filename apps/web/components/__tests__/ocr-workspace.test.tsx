import userEvent from "@testing-library/user-event";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OcrWorkspace } from "@/components/ocr-workspace";

const downloadMocks = vi.hoisted(() => ({
  downloadBatchZip: vi.fn(),
  downloadHtmlFile: vi.fn(),
  downloadTextFile: vi.fn(),
  requestPdfExport: vi.fn(),
}));

vi.mock("@/lib/browser-id", () => ({
  getOrCreateBrowserId: () => "browser-id-test",
}));

vi.mock("@/lib/downloads", () => downloadMocks);

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
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:scanlume-preview"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  Object.values(downloadMocks).forEach((mock) => mock.mockReset());
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

  it("localizes the English usage board and free-trial rules", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          ...authenticatedLimitsResponse,
          viewer: { authenticated: false, type: "anonymous", user: null },
          plan: { id: "anonymous", label: "Teste gratis", shortLabel: "Teste" },
          limits: { ...authenticatedLimitsResponse.limits, dailyImages: 5, dailyCredits: 5 },
          usage: { usedImages: 0, usedCredits: 0, remainingImages: 5, remainingCredits: 5 },
        }),
      }),
    );
    const user = userEvent.setup();

    render(<OcrWorkspace defaultMode="simple" locale="en" priorityLayout />);

    expect(await screen.findByText(/Today \/ limit/i)).toBeInTheDocument();
    expect(screen.getByText(/Anonymous credits/i)).toBeInTheDocument();
    expect(screen.getByText(/Free trial/i)).toBeInTheDocument();
    await user.hover(screen.getByRole("button", { name: /Understand free trial limits/i }));
    expect(await screen.findByText(/How the free trial is calculated/i)).toBeInTheDocument();
    expect(screen.getByText(/Simple OCR uses 1 credit per image/i)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/Hoje \/ limite|Ver regras|Creditos anonimos|Como calculamos|Entrar agora|Teste gratis/i);
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

  it("sets a clear waiting expectation while OCR is running", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/v1/limits")) {
        return Promise.resolve({
          json: async () => authenticatedLimitsResponse,
        });
      }

      return new Promise(() => undefined);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<OcrWorkspace defaultMode="simple" priorityLayout />);

    const input = document.querySelector("#scanlume-upload") as HTMLInputElement;
    const file = new File(["scanlume"], "teste.png", { type: "image/png" });

    await user.upload(input, file);
    const startButton = screen.getByRole("button", { name: /Iniciar OCR simples/i });

    await waitFor(() => expect(startButton).toBeEnabled());
    await user.click(startButton);

    expect(await screen.findByText(/Pode levar alguns segundos/i)).toBeInTheDocument();
  });

  it("sends the selected OCR language with image requests", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/v1/limits")) {
        return Promise.resolve({
          json: async () => authenticatedLimitsResponse,
        });
      }

      return Promise.resolve(
        new Response(JSON.stringify({ result: { txt: "English text", preview: "English text" } }), { status: 200 }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<OcrWorkspace defaultMode="simple" locale="en" priorityLayout />);

    await user.selectOptions(screen.getByRole("combobox", { name: /OCR language/i }), "en");
    const input = document.querySelector("#scanlume-upload") as HTMLInputElement;
    await user.upload(input, new File(["scanlume"], "english.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: /Start Simple OCR/i }));

    await screen.findByDisplayValue("English text");
    const ocrRequest = fetchMock.mock.calls.find(([url]) => String(url).includes("/v1/ocr"));
    expect(JSON.parse(String(ocrRequest?.[1]?.body))).toMatchObject({ mode: "simple", ocrLanguage: "en" });
  });

  it("downloads the edited result text instead of the original payload", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/v1/limits")) {
        return Promise.resolve({
          json: async () => authenticatedLimitsResponse,
        });
      }

      return Promise.resolve(
        new Response(JSON.stringify({ result: { txt: "Original text", preview: "Original text" } }), { status: 200 }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<OcrWorkspace defaultMode="simple" priorityLayout />);

    const input = document.querySelector("#scanlume-upload") as HTMLInputElement;
    await user.upload(input, new File(["scanlume"], "receipt.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: /Iniciar OCR simples/i }));

    const editor = await screen.findByDisplayValue("Original text");
    await user.clear(editor);
    await user.type(editor, "Edited text");
    await user.click(screen.getByRole("button", { name: /Baixar como/i }));

    expect(downloadMocks.downloadTextFile).toHaveBeenCalledWith("receipt.txt", "Edited text");
  });

  it("retries a single failed file without clearing the queue", async () => {
    let ocrCalls = 0;
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/v1/limits")) {
        return Promise.resolve({
          json: async () => authenticatedLimitsResponse,
        });
      }

      ocrCalls += 1;
      if (ocrCalls === 1) {
        return Promise.resolve(new Response(JSON.stringify({ error: "Temporary OCR failure" }), { status: 500 }));
      }

      return Promise.resolve(
        new Response(JSON.stringify({ result: { txt: "Recovered text", preview: "Recovered text" } }), { status: 200 }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<OcrWorkspace defaultMode="simple" priorityLayout />);

    const input = document.querySelector("#scanlume-upload") as HTMLInputElement;
    await user.upload(input, new File(["scanlume"], "retry.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: /Iniciar OCR simples/i }));

    await screen.findByText("Temporary OCR failure");
    await user.click(screen.getByRole("button", { name: /Tentar novamente/i }));

    expect(await screen.findByDisplayValue("Recovered text")).toBeInTheDocument();
    expect(ocrCalls).toBe(2);
  });
});
