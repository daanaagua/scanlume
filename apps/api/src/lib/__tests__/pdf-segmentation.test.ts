import { describe, expect, it } from "vitest";

import { buildPdfPageResult, mapStructuredOcrBlocks, orderRegionsForReading } from "../pdf-segmentation";

describe("orderRegionsForReading", () => {
  it("keeps full-width content before lower two-column content", () => {
    const ordered = orderRegionsForReading([
      { id: "left", top: 400, left: 0, width: 250, lane: "left" },
      { id: "hero-image", top: 180, left: 0, width: 520, lane: "full" },
      { id: "intro", top: 40, left: 0, width: 520, lane: "full" },
      { id: "right", top: 400, left: 270, width: 250, lane: "right" },
    ]);

    expect(ordered.map((item) => item.id)).toEqual(["intro", "hero-image", "left", "right"]);
  });
});

describe("buildPdfPageResult", () => {
  it("omits text fields for failed pages", () => {
    const page = buildPdfPageResult({
      pageNumber: 4,
      status: "failed",
      source: "ocr",
      width: 100,
      height: 200,
      errorCode: "ocr_failed",
      errorMessage: "bad page",
    });

    expect(page.text).toBeUndefined();
    expect(page.errorCode).toBe("ocr_failed");
  });
});

describe("mapStructuredOcrBlocks", () => {
  it("splits a shared OCR region into non-overlapping block boxes with stable order", () => {
    const blocks = mapStructuredOcrBlocks({
      idPrefix: "region-1",
      orderOffset: 3,
      source: "ocr",
      regionBbox: { x: 24, y: 200, width: 220, height: 180 },
      blocks: [
        { type: "h1", text: "Titulo", order: 0 },
        { type: "p", text: "Primeiro paragrafo", order: 1 },
        { type: "p", text: "Segundo paragrafo", order: 2 },
      ],
    });

    expect(blocks.map((block) => block.order)).toEqual([3, 4, 5]);
    expect(blocks[0]?.bbox?.y).toBeLessThan(blocks[1]?.bbox?.y ?? 0);
    expect(blocks[1]?.bbox?.y).toBeLessThan(blocks[2]?.bbox?.y ?? 0);
    expect(blocks.every((block) => (block.bbox?.height ?? 0) > 0)).toBe(true);
  });
});
