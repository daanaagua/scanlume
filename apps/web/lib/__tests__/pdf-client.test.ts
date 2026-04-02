import { describe, expect, it } from "vitest";

import { buildPdfSelectionSummary, mapPdfOcrError, parseJsonResponse } from "@/lib/pdf-client";
import { buildNativeTextBlocks, buildPreparedPdfPagePayload } from "@/lib/pdf-renderer";

describe("buildPdfSelectionSummary", () => {
  it("marks a PDF as truncated when local pages exceed the remaining allowance", () => {
    const summary = buildPdfSelectionSummary({
      totalPages: 12,
      remainingPages: 5,
      maxPagesPerDocument: 50,
    });

    expect(summary).toMatchObject({
      processablePages: 5,
      lockedPages: 7,
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
