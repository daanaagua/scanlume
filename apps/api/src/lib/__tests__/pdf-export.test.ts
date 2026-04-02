import { inflateSync } from "node:zlib";

import { PDFArray, PDFDocument, PDFRawStream, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";

import {
  buildSearchableOverlayDrawSpec,
  buildSearchableRegionLayoutSpec,
  buildExportRouteConfig,
  fitBlocksToRegion,
  buildReflowedPdfBytes,
  buildReflowedPdfPlan,
  buildSearchablePdfBytes,
  buildSearchablePdfPlan,
  filterOverlappingOcrBlocks,
  mapPdfExportError,
  signPdfExportToken,
  streamPdfResponse,
  verifyPdfExportToken,
} from "../pdf-export";

describe("verifyPdfExportToken", () => {
  it("rejects a tampered export manifest hash", async () => {
    const token = await signPdfExportToken({
      sourceHash: "source",
      exportManifestHash: "expected",
      processedPageNumbers: [1, 2, 3],
      expiresAt: Date.now() + 1_000,
      secret: "secret",
    });

    await expect(
      verifyPdfExportToken(token, {
        sourceHash: "source",
        exportManifestHash: "other",
        now: Date.now(),
        secret: "secret",
      }),
    ).rejects.toThrow(/manifest/i);
  });
});

describe("pdf export responses", () => {
  it("maps token failures to PdfExportError JSON", () => {
    expect(mapPdfExportError(new Error("token"))).toEqual({
      ok: false,
      status: 400,
      code: "pdf_export_token_invalid",
      error: "Invalid export token.",
    });
  });

  it("sets the required PDF download headers on success", () => {
    const response = streamPdfResponse(new Uint8Array([1, 2, 3]), "scanlume-searchable.pdf");

    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("scanlume-searchable.pdf");
  });
});

describe("buildSearchablePdfPlan", () => {
  it("keeps text-layer pages passthrough, failed pages visual-only, and omits locked pages", async () => {
    const plan = await buildSearchablePdfPlan({
      totalPages: 5,
      failedPageNumbers: [2],
      pageLayouts: [
        { pageNumber: 1, source: "text-layer", width: 600, height: 800, blocks: [] },
        { pageNumber: 2, source: "ocr", width: 600, height: 800, blocks: [] },
        { pageNumber: 3, source: "mixed", width: 600, height: 800, blocks: [] },
      ],
    });

    expect(plan.pages).toEqual([
      { pageNumber: 1, mode: "passthrough", overlayRegions: [] },
      { pageNumber: 2, mode: "visual-only", overlayRegions: [] },
      { pageNumber: 3, mode: "overlay", overlayRegions: [] },
    ]);
  });

  it("suppresses OCR overlays that collide with native text on mixed pages", () => {
    const blocks = filterOverlappingOcrBlocks([
      { source: "text-layer", bbox: { x: 10, y: 10, width: 100, height: 20 } },
      { source: "ocr", bbox: { x: 12, y: 12, width: 100, height: 20 } },
    ]);

    expect(blocks).toEqual([{ source: "text-layer", bbox: { x: 10, y: 10, width: 100, height: 20 } }]);
  });

  it("keeps non-overlapping OCR overlays for mixed pages", () => {
    const blocks = filterOverlappingOcrBlocks([
      { source: "text-layer", bbox: { x: 10, y: 10, width: 100, height: 20 } },
      { source: "ocr", bbox: { x: 10, y: 120, width: 180, height: 90 } },
    ]);

    expect(blocks).toEqual([
      { source: "text-layer", bbox: { x: 10, y: 10, width: 100, height: 20 } },
      { source: "ocr", bbox: { x: 10, y: 120, width: 180, height: 90 } },
    ]);
  });

  it("generates a real searchable PDF file instead of JSON bytes", async () => {
    const source = await PDFDocument.create();
    const font = await source.embedFont(StandardFonts.Helvetica);
    const page = source.addPage([300, 400]);
    page.drawText("Native text", { x: 24, y: 340, size: 12, font });

    const bytes = await buildSearchablePdfBytes(new Uint8Array(await source.save()), {
      totalPages: 1,
      failedPageNumbers: [],
      pageLayouts: [
        {
          pageNumber: 1,
          source: "mixed",
          width: 300,
          height: 400,
          blocks: [
            { text: "Native text", source: "text-layer", bbox: { x: 24, y: 40, width: 80, height: 14 } },
            { text: "Texto da imagem", source: "ocr", bbox: { x: 24, y: 180, width: 140, height: 20 } },
          ],
        },
      ],
    });

    expect(new TextDecoder().decode(bytes.slice(0, 8))).toContain("%PDF-");
    await expect(PDFDocument.load(bytes)).resolves.toBeTruthy();
  });

  it("top-aligns searchable overlay text inside the OCR region instead of dropping it below", async () => {
    const source = await PDFDocument.create();
    const font = await source.embedFont(StandardFonts.Helvetica);

    const spec = buildSearchableOverlayDrawSpec({
      block: {
        text: "O Scanlume reconhece texto em PDFs mistos.",
        bbox: { x: 24, y: 180, width: 220, height: 28 },
      },
      pageLayout: { width: 300, height: 400 },
      pageSize: { width: 300, height: 400 },
      font,
    });

    expect(spec).not.toBeNull();
    expect(spec?.text).toBe("O Scanlume reconhece texto em PDFs mistos.");
    expect(spec?.y ?? 0).toBeGreaterThan(200);
    expect(spec?.y ?? 0).toBeLessThan(212);
  });

  it("reconstructs OCR text inside the original region footprint with a backdrop", () => {
    const spec = buildSearchableRegionLayoutSpec({
      region: { x: 24, y: 160, width: 220, height: 120 },
      blocks: [
        { type: "h1", text: "Titulo", order: 0 },
        { type: "p", text: "Paragrafo de teste", order: 1 },
      ],
    });

    expect(spec.backdrop).toEqual({ x: 24, y: 160, width: 220, height: 120 });
    expect(spec.drawnBlocks[0]?.bbox.y ?? 0).toBeGreaterThanOrEqual(160);
    expect(spec.drawnBlocks.at(-1)?.bbox.y ?? 0).toBeLessThan(280);
  });

  it("never shrinks paragraph text below 6pt", () => {
    const spec = fitBlocksToRegion({
      region: { x: 0, y: 0, width: 140, height: 80 },
      blocks: [{ type: "p", text: "texto ".repeat(80), order: 0 }],
      pageSize: { width: 300, height: 400 },
      pageLayout: { width: 300, height: 400 },
    });

    expect(Math.min(...spec.blocks.map((block) => block.fontSize))).toBeGreaterThanOrEqual(6);
  });

  it("falls back to character wrapping when a token exceeds the region width", () => {
    const spec = fitBlocksToRegion({
      region: { x: 0, y: 0, width: 80, height: 120 },
      blocks: [{ type: "p", text: "superlongtokenwithoutspaces", order: 0 }],
      pageSize: { width: 300, height: 400 },
      pageLayout: { width: 300, height: 400 },
    });

    expect(spec.blocks[0]?.lines.length).toBeGreaterThan(1);
  });

  it("adds ellipsis when content still cannot fit after minimum-size packing", () => {
    const spec = fitBlocksToRegion({
      region: { x: 0, y: 0, width: 60, height: 40 },
      blocks: [{ type: "p", text: "texto ".repeat(200), order: 0 }],
      pageSize: { width: 300, height: 400 },
      pageLayout: { width: 300, height: 400 },
    });

    expect(spec.blocks.at(-1)?.lines.at(-1)).toContain("...");
  });
});

describe("buildReflowedPdfPlan", () => {
  it("builds reflowed PDFs from normalized blocks only", async () => {
    const plan = await buildReflowedPdfPlan({
      pageLayouts: [
        { pageNumber: 1, blocks: [{ text: "Title" }] },
        { pageNumber: 2, blocks: [{ text: "Body" }] },
      ],
    });

    expect(plan.mode).toBe("reflowed");
    expect(plan.blocks.map((block) => block.text).join(" ")).toContain("Title");
  });

  it("generates a real reflowed PDF file instead of JSON bytes", async () => {
    const bytes = await buildReflowedPdfBytes({
      pageLayouts: [
        {
          pageNumber: 1,
          blocks: [
            { kind: "h1", text: "Title" },
            { kind: "p", text: "Body copy from the PDF export." },
          ],
        },
      ],
    });

    expect(new TextDecoder().decode(bytes.slice(0, 8))).toContain("%PDF-");
    await expect(PDFDocument.load(bytes)).resolves.toBeTruthy();
    expect(Buffer.from(bytes).includes(Buffer.from("Page 1"))).toBe(false);
  });

  it("keeps page region grouping instead of injecting page labels into reflowed PDF", async () => {
    const bytes = await buildReflowedPdfBytes({
      pageLayouts: [
        {
          pageNumber: 1,
          blocks: [
            { kind: "h1", text: "Titulo", order: 0, bbox: { x: 24, y: 80, width: 200, height: 30 } },
            { kind: "p", text: "Texto do bloco", order: 1, bbox: { x: 24, y: 120, width: 200, height: 80 } },
          ],
        },
      ],
    });

    expect(Buffer.from(bytes).includes(Buffer.from("Page 1"))).toBe(false);
    const pdf = await PDFDocument.load(bytes);
    const page = pdf.getPages()[0];
    const contents = pdf.context.lookup(page.node.Contents());
    expect(contents).toBeInstanceOf(PDFArray);
    const contentArray = contents as PDFArray;

    const operators = Array.from({ length: contentArray.size() }, (_, index) => {
      const stream = pdf.context.lookup(contentArray.get(index)) as PDFRawStream;
      return inflateSync(stream.contents).toString("latin1");
    }).join("\n");

    expect((operators.match(/\bTm\b/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("exposes the reflowed export route with the same manifest verification path", () => {
    expect(buildExportRouteConfig("reflowed")).toMatchObject({
      endpoint: "/v1/pdf/export/reflowed",
      contentType: "application/pdf",
    });
  });
});
