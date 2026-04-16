import { describe, expect, it } from "vitest";

import {
  buildPdfPageResult,
  mapStructuredOcrBlocks,
  orderPageBlocksForReading,
  orderRegionsForReading,
} from "../pdf-segmentation";

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

  it("keeps table blocks atomic instead of expanding them into fake paragraphs", () => {
    const blocks = mapStructuredOcrBlocks({
      idPrefix: "region-table",
      orderOffset: 8,
      source: "ocr",
      regionBbox: { x: 40, y: 120, width: 320, height: 220 },
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
          records: [
            {
              rowNumber: 2,
              groupLabel: "",
              fields: [{ column: "Amount", value: "20.00" }],
            },
          ],
          notes: [],
        },
      ],
    });

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      kind: "table",
      order: 8,
      text: "Resumo de vendas",
    });
  });
});

describe("orderPageBlocksForReading", () => {
  it("merges native and OCR blocks by reading order instead of source order", () => {
    const ordered = orderPageBlocksForReading({
      pageWidth: 600,
      blocks: [
        {
          id: "native-late",
          kind: "p",
          order: 0,
          text: "Native lower block",
          source: "text-layer",
          bbox: { x: 48, y: 220, width: 180, height: 30 },
        },
        {
          id: "ocr-hero",
          kind: "h1",
          order: 50,
          text: "OCR heading",
          source: "ocr",
          bbox: { x: 40, y: 36, width: 500, height: 48 },
        },
        {
          id: "native-left",
          kind: "p",
          order: 1,
          text: "Native left column",
          source: "text-layer",
          bbox: { x: 44, y: 128, width: 200, height: 28 },
        },
        {
          id: "ocr-right",
          kind: "p",
          order: 51,
          text: "OCR right column",
          source: "ocr",
          bbox: { x: 336, y: 132, width: 210, height: 28 },
        },
      ],
    });

    expect(ordered.map((block) => block.id)).toEqual(["ocr-hero", "native-left", "ocr-right", "native-late"]);
    expect(ordered.map((block) => block.order)).toEqual([0, 1, 2, 3]);
  });

  it("falls back to source order when blocks have no bounding boxes", () => {
    const ordered = orderPageBlocksForReading({
      pageWidth: 600,
      blocks: [
        { id: "native-0", kind: "p", order: 4, text: "One", source: "text-layer" },
        { id: "ocr-0", kind: "p", order: 7, text: "Two", source: "ocr" },
      ],
    });

    expect(ordered.map((block) => block.id)).toEqual(["native-0", "ocr-0"]);
    expect(ordered.map((block) => block.order)).toEqual([0, 1]);
  });

  it("reads obvious dual-column layouts by finishing the left column before the right column", () => {
    const ordered = orderPageBlocksForReading({
      pageWidth: 720,
      blocks: [
        {
          id: "left-top",
          kind: "p",
          order: 0,
          text: "Left intro",
          source: "text-layer",
          bbox: { x: 54, y: 120, width: 230, height: 26 },
        },
        {
          id: "right-top",
          kind: "p",
          order: 1,
          text: "Right intro",
          source: "text-layer",
          bbox: { x: 420, y: 126, width: 230, height: 26 },
        },
        {
          id: "left-bottom",
          kind: "p",
          order: 2,
          text: "Left details",
          source: "text-layer",
          bbox: { x: 58, y: 188, width: 228, height: 26 },
        },
        {
          id: "right-bottom",
          kind: "p",
          order: 3,
          text: "Right details",
          source: "text-layer",
          bbox: { x: 416, y: 196, width: 230, height: 26 },
        },
      ],
    });

    expect(ordered.map((block) => block.id)).toEqual(["left-top", "left-bottom", "right-top", "right-bottom"]);
  });

  it("keeps grouped OCR region blocks together before nearby blocks from another region", () => {
    const ordered = orderPageBlocksForReading({
      pageWidth: 640,
      blocks: [
        {
          id: "ocr-caption",
          kind: "p",
          order: 4,
          text: "Figura 1",
          source: "ocr",
          groupId: "ocr-region-1",
          groupBbox: { x: 48, y: 96, width: 220, height: 128 },
          bbox: { x: 48, y: 100, width: 220, height: 20 },
        },
        {
          id: "ocr-note",
          kind: "p",
          order: 5,
          text: "Legenda da figura",
          source: "ocr",
          groupId: "ocr-region-1",
          groupBbox: { x: 48, y: 96, width: 220, height: 128 },
          bbox: { x: 48, y: 170, width: 220, height: 18 },
        },
        {
          id: "native-sidebar",
          kind: "p",
          order: 6,
          text: "Sidebar text",
          source: "text-layer",
          bbox: { x: 360, y: 132, width: 180, height: 24 },
        },
      ],
    });

    expect(ordered.map((block) => block.id)).toEqual(["ocr-caption", "ocr-note", "native-sidebar"]);
  });
});
