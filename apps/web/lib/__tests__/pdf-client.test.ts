import { describe, expect, it, vi } from "vitest";

import { buildPdfSelectionSummary, mapPdfOcrError, parseJsonResponse } from "@/lib/pdf-client";
import { API_INPUT_NOTE, API_PRICING } from "@/lib/pricing";
import { PDF_PAGE_RENDER_INTENT, buildNativeTextBlocks, buildPdfPageRenderInput, buildPreparedPdfPagePayload, buildPreparedPdfPages } from "@/lib/pdf-renderer";

describe("buildPdfSelectionSummary", () => {
  it("marks a PDF as truncated when local pages exceed the remaining allowance", () => {
    const summary = buildPdfSelectionSummary({
      totalPages: 6,
      remainingCredits: 3,
      maxPagesPerDocument: 50,
    } as never);

    expect(summary).toMatchObject({
      processablePages: 1,
      lockedPages: 5,
      truncated: true,
    });
  });
});

describe("mapPdfOcrError", () => {
  it("maps the frozen server error codes to specific UI copy", () => {
    expect(mapPdfOcrError({ code: "pdf_job_in_progress", error: "busy", remainingPdfPagesToday: 0 })).toMatch(
      /outro pdf ja esta em processamento/i,
    );
    expect(mapPdfOcrError({ code: "pdf_page_limit_reached", error: "limit", remainingPdfPagesToday: 0 })).toMatch(
      /limite gratuito/i,
    );
    expect(mapPdfOcrError({ code: "pdf_invalid", error: "invalid", remainingPdfPagesToday: 0 })).toMatch(
      /nao pode ser lido/i,
    );
  });
});

describe("parseJsonResponse", () => {
  it("turns a plain text internal server error into a structured payload", async () => {
    const response = new Response("Internal Server Error", {
      status: 500,
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });

    await expect(parseJsonResponse<{ error: string }>(response)).resolves.toEqual({
      error: "Internal Server Error",
    });
  });
});

describe("buildPreparedPdfPagePayload", () => {
  it("builds an OCR page when no native text blocks are present", () => {
    expect(
      buildPreparedPdfPagePayload({
        pageNumber: 1,
        pagePngBase64: "abc123",
        width: 800,
        height: 1200,
        nativeTextBlocks: [],
      }),
    ).toMatchObject({
      pageNumber: 1,
      source: "ocr",
      pagePngBase64: "abc123",
      width: 800,
      height: 1200,
    });
  });

  it("builds a text-layer page when native text exists", () => {
    expect(
      buildPreparedPdfPagePayload({
        pageNumber: 2,
        pagePngBase64: "abc123",
        width: 640,
        height: 960,
        nativeTextBlocks: [{ text: "hello", bbox: { x: 0, y: 0, width: 10, height: 10 } }],
      }),
    ).toMatchObject({
      pageNumber: 2,
      source: "text-layer",
      width: 640,
      height: 960,
      nativeTextBlocks: [{ text: "hello" }],
    });
  });

  it("builds a mixed page when native text and OCR regions both exist", () => {
    expect(
      buildPreparedPdfPagePayload({
        pageNumber: 3,
        pagePngBase64: "abc123",
        width: 720,
        height: 1080,
        nativeTextBlocks: [{ text: "hello", bbox: { x: 0, y: 0, width: 10, height: 10 } }],
        ocrRegions: [{ id: "region-1", imageBase64: "region", bbox: { x: 20, y: 40, width: 80, height: 60 } }],
      } as never),
    ).toMatchObject({
      pageNumber: 3,
      source: "mixed",
      width: 720,
      height: 1080,
      nativeTextBlocks: [{ text: "hello" }],
      ocrRegions: [{ id: "region-1" }],
    });
  });
});

describe("buildPreparedPdfPages", () => {
  it("creates more than one OCR region for mixed PDF pages with separated raster islands", async () => {
    const pixels = new Uint8ClampedArray(120 * 80 * 4);
    const paintRect = (startX: number, startY: number, endX: number, endY: number) => {
      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const offset = (y * 120 + x) * 4;
          pixels[offset] = 24;
          pixels[offset + 1] = 24;
          pixels[offset + 2] = 24;
          pixels[offset + 3] = 255;
        }
      }
    };

    paintRect(10, 10, 26, 24);
    paintRect(84, 48, 108, 66);

    window.pdfjsLib = {
      GlobalWorkerOptions: { workerSrc: "" },
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async () => ({
            getViewport: () => ({ width: 120, height: 80 }),
            render: () => ({ promise: Promise.resolve() }),
            getTextContent: async () => ({
              items: [
                {
                  str: "Titulo nativo",
                  width: 28,
                  height: 10,
                  transform: [10, 0, 0, 10, 38, 28],
                },
              ],
            }),
          }),
        }),
      }),
    };

    const originalCreateElement = document.createElement.bind(document);
    let canvasCount = 0;
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      const element = originalCreateElement(tagName, options);
      if (tagName !== "canvas") {
        return element;
      }

      canvasCount += 1;
      const canvas = element as HTMLCanvasElement;
      const context = {
        canvas,
        drawImage: () => undefined,
        getImageData: () => ({ data: pixels }),
      } as unknown as CanvasRenderingContext2D;

      Object.defineProperty(canvas, "getContext", {
        configurable: true,
        value: () => context,
      });
      Object.defineProperty(canvas, "toBlob", {
        configurable: true,
        value: (callback: BlobCallback) => {
          callback(new Blob([`canvas-${canvasCount}`], { type: "image/png" }));
        },
      });

      return canvas;
    }) as typeof document.createElement);

    const file = {
      type: "application/pdf",
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    } as File;
    const pages = await buildPreparedPdfPages(file, 1);

    createElementSpy.mockRestore();

    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({
      source: "mixed",
      pageNumber: 1,
    });
    expect(pages[0]?.ocrRegions).toHaveLength(2);
    expect(pages[0]?.ocrRegions.map((region) => region.id)).toEqual(["page-1-region-1", "page-1-region-2"]);
  });
});

describe("buildNativeTextBlocks", () => {
  it("scales pdf.js text coordinates into rendered canvas space", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 892;
    canvas.height = 1263;

    const blocks = buildNativeTextBlocks(
      [
        {
          str: "Scanlume PDF OCR Test",
          width: 172,
          height: 22,
          transform: [22, 0, 0, 22, 48, 790],
        },
      ],
      canvas,
      1.5,
    );

    expect(blocks[0]).toMatchObject({
      text: "Scanlume PDF OCR Test",
      bbox: {
        x: 72,
        y: 45,
        width: 258,
        height: 33,
      },
    });
  });
});

describe("API pricing copy", () => {
  it("states the v1 contract as JSON plus base64 data URL only", () => {
    expect(API_INPUT_NOTE).toMatch(/json/i);
    expect(API_INPUT_NOTE).toMatch(/base64 data url/i);
    expect(API_INPUT_NOTE).toMatch(/apenas|only/i);
    expect(API_PRICING.every((plan) => /json/i.test(plan.inputs) && /base64 data url/i.test(plan.inputs))).toBe(true);
  });
});

describe("PDF_PAGE_RENDER_INTENT", () => {
  it("locks the browser PDF renderer to the print intent", () => {
    expect(PDF_PAGE_RENDER_INTENT).toBe("print");
  });

  it("builds page render options with the print intent", () => {
    const canvasContext = { canvas: document.createElement("canvas") } as CanvasRenderingContext2D;
    expect(
      buildPdfPageRenderInput({
        canvasContext,
        viewport: { width: 892, height: 1263 },
      }),
    ).toMatchObject({
      canvasContext,
      viewport: { width: 892, height: 1263 },
      intent: "print",
    });
  });
});
