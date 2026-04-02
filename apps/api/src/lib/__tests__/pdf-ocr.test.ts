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
