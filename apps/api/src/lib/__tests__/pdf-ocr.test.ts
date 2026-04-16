import { PDFDocument } from "pdf-lib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../../index";
import { assemblePdfDocumentResult, buildPdfRouteOutcome, sanitizePreviewHtml } from "../pdf-ocr";
import { buildPdfRegionPrompt } from "../pdf-prompts";
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
  const pdf = await PDFDocument.create();
  for (let index = 0; index < input.totalPages; index += 1) {
    pdf.addPage([300, 400]);
  }
  const pdfBytes = await pdf.save();
  const pdfBuffer = new Uint8Array(pdfBytes.byteLength);
  pdfBuffer.set(pdfBytes);

  const formData = new FormData();
  formData.set("file", new File([pdfBuffer], "sample.pdf", { type: "application/pdf" }));
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
    expect(result.tableStats).toEqual({ tableBlocks: 0, rowGroups: 0, extractedRecords: 0 });
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

  it("counts table blocks and records across successful PDF pages", () => {
    const result = assemblePdfDocumentResult({
      documentId: "doc-4",
      fileName: "tables.pdf",
      totalPages: 1,
      pages: [
        {
          pageNumber: 1,
          status: "success",
          source: "mixed",
          width: 600,
          height: 800,
          html: "<table><tr><th>Categoria</th></tr><tr><td>Frutas</td></tr></table>",
          markdown: "| Categoria |\n| --- |\n| Frutas |",
          text: "Categoria\nFrutas",
          blocks: [
            {
              id: "table-1",
              kind: "table",
              order: 0,
              text: "Resumo de vendas",
              rowGroups: [{ label: "Frutas", rowStart: 2, rowEnd: 3 }],
              records: [
                { rowNumber: 2, groupLabel: "Frutas", fields: [{ column: "Amount", value: "20.00" }] },
                { rowNumber: 3, groupLabel: "Frutas", fields: [{ column: "Amount", value: "18.00" }] },
              ],
            },
          ],
        },
      ],
      lockedPages: 0,
      remainingPdfPagesToday: 8,
      exportToken: "signed",
    });

    expect(result.tableStats).toEqual({
      tableBlocks: 1,
      rowGroups: 1,
      extractedRecords: 2,
    });
  });
});

describe("buildPdfRegionPrompt", () => {
  it("tells the OCR model to preserve pt-BR accents and edge text", () => {
    const prompt = buildPdfRegionPrompt({ pageNumber: 1, regionKind: "region" });

    expect(prompt).toMatch(/pt-BR|Portuguese/i);
    expect(prompt).toMatch(/accent|diacritic/i);
    expect(prompt).toMatch(/edge text|partial words/i);
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

  it("rejects requests when claimed totalPages does not match the uploaded PDF", async () => {
    const env = createEnv();
    const request = await createPdfRequest({
      browserId: "anon-pdf-mismatch",
      totalPages: 2,
      preparedPages: [
        { pageNumber: 1, source: "text-layer", width: 600, height: 800, nativeTextBlocks: [{ text: "Page 1", bbox: { x: 0, y: 0, width: 120, height: 24 } }], ocrRegions: [] },
        { pageNumber: 2, source: "text-layer", width: 600, height: 800, nativeTextBlocks: [{ text: "Page 2", bbox: { x: 0, y: 0, width: 120, height: 24 } }], ocrRegions: [] },
      ],
    });

    const form = await request.formData();
    form.set("totalPages", "3");

    const response = await app.fetch(
      new Request(request.url, {
        method: "POST",
        body: form,
      }),
      env as never,
    );
    const payload = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(payload).toMatchObject({ code: "pdf_invalid" });
    expect(String(payload.error)).toMatch(/totalPages/i);
  });

  it("rejects duplicate prepared page numbers before OCR work starts", async () => {
    const env = createEnv();
    const response = await app.fetch(
      await createPdfRequest({
        browserId: "anon-pdf-duplicate",
        totalPages: 2,
        preparedPages: [
          { pageNumber: 1, source: "text-layer", width: 600, height: 800, nativeTextBlocks: [{ text: "First", bbox: { x: 0, y: 0, width: 120, height: 24 } }], ocrRegions: [] },
          { pageNumber: 1, source: "text-layer", width: 600, height: 800, nativeTextBlocks: [{ text: "Duplicate", bbox: { x: 0, y: 0, width: 120, height: 24 } }], ocrRegions: [] },
        ],
      }),
      env as never,
    );
    const payload = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(payload).toMatchObject({ code: "pdf_invalid" });
    expect(String(payload.error)).toMatch(/duplicate/i);
  });

  it("writes mixed-page output in page reading order", async () => {
    const env = createEnv();
    const mockArkResponse = (blocks: Array<{ type: string; text: string; order: number }>) =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({ blocks }),
              },
            },
          ],
          usage: { input_tokens: 1, output_tokens: 1, input_tokens_details: { cached_tokens: 0 } },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockImplementationOnce(() => Promise.resolve(mockArkResponse([{ type: "h1", text: "OCR heading", order: 0 }])))
        .mockImplementationOnce(() => Promise.resolve(mockArkResponse([{ type: "p", text: "OCR right note", order: 0 }]))),
    );

    const response = await app.fetch(
      await createPdfRequest({
        browserId: "anon-pdf-mixed-order",
        totalPages: 1,
        preparedPages: [
          {
            pageNumber: 1,
            source: "mixed",
            width: 600,
            height: 800,
            nativeTextBlocks: [
              { text: "Native lower block", bbox: { x: 48, y: 220, width: 180, height: 30 } },
              { text: "Native left column", bbox: { x: 44, y: 128, width: 200, height: 28 } },
            ],
            ocrRegions: [
              {
                id: "ocr-top",
                imageBase64: "ZmFrZQ==",
                bbox: { x: 40, y: 36, width: 500, height: 48 },
              },
              {
                id: "ocr-right",
                imageBase64: "ZmFrZTI=",
                bbox: { x: 336, y: 132, width: 210, height: 28 },
              },
            ],
          },
        ],
      }),
      env as never,
    );
    const payload = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(payload.txt).toMatch(/OCR heading[\s\S]*Native left column[\s\S]*OCR right note[\s\S]*Native lower block/);
    expect((payload.exportManifest as { pageLayouts?: Array<{ blocks?: Array<{ text?: string }> }> }).pageLayouts?.[0]?.blocks?.map((block) => block.text)).toEqual([
      "OCR heading",
      "Native left column",
      "OCR right note",
      "Native lower block",
    ]);
  });

  it("keeps structured table OCR intact inside mixed PDF pages", async () => {
    const env = createEnv();
    const mockArkResponse = new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                blocks: [
                  {
                    type: "table",
                    order: 0,
                    title: "Resumo de vendas",
                    columns: ["Categoria", "Amount"],
                    headerRows: [1],
                    cells: [
                      { rowStart: 1, rowEnd: 1, colStart: 1, colEnd: 1, text: "Categoria", isHeader: true, align: "left" },
                      { rowStart: 1, rowEnd: 1, colStart: 2, colEnd: 2, text: "Amount", isHeader: true, align: "right" },
                      { rowStart: 2, rowEnd: 2, colStart: 1, colEnd: 1, text: "Frutas", isHeader: false, align: "left" },
                      { rowStart: 2, rowEnd: 2, colStart: 2, colEnd: 2, text: "20.00", isHeader: false, align: "right" },
                    ],
                    rowGroups: [],
                    records: [{ rowNumber: 2, groupLabel: "", fields: [{ column: "Amount", value: "20.00" }] }],
                    notes: [],
                  },
                ],
              }),
            },
          },
        ],
        usage: { input_tokens: 1, output_tokens: 1, input_tokens_details: { cached_tokens: 0 } },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(mockArkResponse.clone())));

    const response = await app.fetch(
      await createPdfRequest({
        browserId: "anon-pdf-table-block",
        totalPages: 1,
        preparedPages: [
          {
            pageNumber: 1,
            source: "ocr",
            width: 600,
            height: 800,
            nativeTextBlocks: [],
            pagePngBase64: "ZmFrZQ==",
            ocrRegions: [],
          },
        ],
      }),
      env as never,
    );
    const payload = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(String(payload.html)).toContain("<table>");
    expect(payload).toMatchObject({
      tableStats: {
        tableBlocks: 1,
        extractedRecords: 1,
      },
    });
    expect((payload.exportManifest as { pageLayouts?: Array<{ blocks?: Array<{ kind?: string }> }> }).pageLayouts?.[0]?.blocks?.[0]).toMatchObject({
      kind: "table",
    });
  });
});
