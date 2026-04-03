import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../../index";
import { assemblePdfDocumentResult, buildPdfRouteOutcome, sanitizePreviewHtml } from "../pdf-ocr";
import { readCreditBalance, sha256Hex, tryConsumeCredits } from "../store";

function createEnv() {
  return {
    ARK_API_BASE: "https://ark.test",
    ARK_MODEL: "mock-model",
    ARK_API_KEY: "mock-key",
  };
}

async function readAnonymousBalance(env: ReturnType<typeof createEnv>, browserId: string) {
  const actorKey = await sha256Hex(`0.0.0.0:${browserId}`);
  return readCreditBalance(env as never, { type: "anonymous", key: actorKey });
}

async function createPdfRequest(input: {
  browserId: string;
  totalPages: number;
  preparedPages: unknown[];
}) {
  const formData = new FormData();
  formData.set("file", new File(["%PDF-1.4\n%mock\n"], "sample.pdf", { type: "application/pdf" }));
  formData.set("browserId", input.browserId);
  formData.set("totalPages", String(input.totalPages));
  formData.set("sourcePath", "/pdf-para-texto");
  formData.set("preparedPages", JSON.stringify(input.preparedPages));

  return new Request("https://api.scanlume.com/v1/pdf/ocr", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("assemblePdfDocumentResult", () => {
  it("builds previewHtml, pageStats, failedPages, and exportManifest together", () => {
    const result = assemblePdfDocumentResult({
      documentId: "doc-1",
      fileName: "quarterly-report.pdf",
      totalPages: 4,
      pages: [
        { pageNumber: 1, status: "success", source: "text-layer", width: 600, height: 800, html: "<p>Page 1</p>", markdown: "Page 1", text: "Page 1", blocks: [] },
        { pageNumber: 2, status: "partial", source: "mixed", width: 600, height: 800, html: "<p>Page 2</p>", markdown: "Page 2", text: "Page 2", blocks: [] },
        { pageNumber: 3, status: "failed", source: "ocr", width: 600, height: 800, errorCode: "ocr_failed", errorMessage: "bad page", blocks: [] },
      ],
      lockedPages: 1,
      remainingPdfPagesToday: 7,
      exportToken: "signed",
    });

    expect(result.previewHtml).toContain("Page 1");
    expect(result.previewHtml).not.toContain("<script");
    expect(result.html).toContain("<h1>quarterly-report</h1>");
    expect(result.md).toContain("Page 2");
    expect(result.txt).toContain("Locked pages: 1");
    expect(result.pageStats).toEqual({ textLayerPages: 1, ocrPages: 1, mixedPages: 1 });
    expect(result.failedPages).toEqual([{ pageNumber: 3, errorCode: "ocr_failed", errorMessage: "bad page" }]);
    expect(result.exportManifest.failedPageNumbers).toEqual([3]);
    expect(result.exportManifest.pageLayouts).toHaveLength(3);
  });

  it("does not inject page labels into whole-document exports", () => {
    const result = assemblePdfDocumentResult({
      documentId: "doc-2",
      fileName: "single-page.pdf",
      totalPages: 1,
      pages: [
        {
          pageNumber: 1,
          status: "success",
          source: "mixed",
          width: 600,
          height: 800,
          html: "<p>Conteudo real</p>",
          markdown: "Conteudo real",
          text: "Conteudo real",
          blocks: [],
        },
      ],
      lockedPages: 0,
      remainingPdfPagesToday: 4,
      exportToken: "signed",
    });

    expect(result.html).not.toContain("<!-- Page 1 -->");
    expect(result.md).not.toContain("Page 1");
    expect(result.txt).toBe("Conteudo real");
  });

  it("preserves structured block output through mixed-page document assembly", () => {
    const result = assemblePdfDocumentResult({
      documentId: "doc-3",
      fileName: "mixed.pdf",
      totalPages: 1,
      pages: [
        {
          pageNumber: 1,
          status: "success",
          source: "mixed",
          width: 600,
          height: 800,
          html: "<h1>Titulo</h1>\n<p>Paragrafo</p>",
          markdown: "# Titulo\n\nParagrafo",
          text: "Titulo\n\nParagrafo",
          blocks: [
            { id: "native-0", kind: "p", order: 0, text: "Texto nativo", source: "text-layer" },
            { id: "ocr-0", kind: "h1", order: 1, text: "Titulo", source: "ocr" },
            { id: "ocr-1", kind: "p", order: 2, text: "Paragrafo", source: "ocr" },
          ],
        },
      ],
      lockedPages: 0,
      remainingPdfPagesToday: 4,
      exportToken: "signed",
    });

    expect(result.md).toContain("# Titulo");
    expect(result.html).toContain("<h1>Titulo</h1>");
    expect(result.exportManifest.pageLayouts[0]?.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "h1", text: "Titulo" }),
        expect.objectContaining({ kind: "p", text: "Paragrafo" }),
      ]),
    );
  });
});

describe("buildPdfRouteOutcome", () => {
  it("returns pdf_processing_failed when no processable page produces usable output", () => {
    expect(() =>
      buildPdfRouteOutcome({
        totalPages: 3,
        pages: [{ pageNumber: 1, status: "failed", source: "ocr", width: 600, height: 800, errorCode: "ocr_failed", errorMessage: "bad", blocks: [] }],
      }),
    ).toThrow(/pdf_processing_failed/i);
  });
});

describe("sanitizePreviewHtml", () => {
  it("removes script tags before returning previewHtml", () => {
    expect(sanitizePreviewHtml('<p>ok</p><script>alert(1)</script>')).toBe("<p>ok</p>");
  });
});

describe("/v1/pdf/ocr credit settlement", () => {
  it("deducts 2 credits for one processed PDF page", async () => {
    const env = createEnv();
    const browserId = "anon-pdf-1page";
    const response = await app.fetch(
      await createPdfRequest({
        browserId,
        totalPages: 1,
        preparedPages: [
          {
            pageNumber: 1,
            source: "text-layer",
            width: 600,
            height: 800,
            nativeTextBlocks: [{ text: "Page 1", bbox: { x: 0, y: 0, width: 120, height: 24 } }],
            ocrRegions: [],
          },
        ],
      }),
      env as never,
    );

    expect(response.status).toBe(200);
    await expect(readAnonymousBalance(env, browserId)).resolves.toMatchObject({ remainingCredits: 3 });
  });

  it("truncates PDF processing to pages that fit in remaining credits", async () => {
    const env = createEnv();
    const browserId = "anon-pdf-truncate";
    const actorKey = await sha256Hex(`0.0.0.0:${browserId}`);
    await tryConsumeCredits(env as never, { actor: { type: "anonymous", key: actorKey }, amount: 2 });

    const response = await app.fetch(
      await createPdfRequest({
        browserId,
        totalPages: 3,
        preparedPages: [
          { pageNumber: 1, source: "text-layer", width: 600, height: 800, nativeTextBlocks: [{ text: "Page 1", bbox: { x: 0, y: 0, width: 120, height: 24 } }], ocrRegions: [] },
          { pageNumber: 2, source: "text-layer", width: 600, height: 800, nativeTextBlocks: [{ text: "Page 2", bbox: { x: 0, y: 0, width: 120, height: 24 } }], ocrRegions: [] },
          { pageNumber: 3, source: "text-layer", width: 600, height: 800, nativeTextBlocks: [{ text: "Page 3", bbox: { x: 0, y: 0, width: 120, height: 24 } }], ocrRegions: [] },
        ],
      }),
      env as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ processedPages: 1, lockedPages: 2 });
  });
});
