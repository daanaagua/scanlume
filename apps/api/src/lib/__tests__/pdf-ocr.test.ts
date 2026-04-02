import { describe, expect, it } from "vitest";

import { assemblePdfDocumentResult, buildPdfRouteOutcome, sanitizePreviewHtml } from "../pdf-ocr";

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
