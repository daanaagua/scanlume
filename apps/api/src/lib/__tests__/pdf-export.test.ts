import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";

import {
  buildExportRouteConfig,
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
            { text: "Title" },
            { text: "Body copy from the PDF export." },
          ],
        },
      ],
    });

    expect(new TextDecoder().decode(bytes.slice(0, 8))).toContain("%PDF-");
    await expect(PDFDocument.load(bytes)).resolves.toBeTruthy();
  });

  it("exposes the reflowed export route with the same manifest verification path", () => {
    expect(buildExportRouteConfig("reflowed")).toMatchObject({
      endpoint: "/v1/pdf/export/reflowed",
      contentType: "application/pdf",
    });
  });
});
