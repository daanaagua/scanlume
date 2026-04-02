import { describe, expect, it } from "vitest";

import { buildPdfSelectionSummary, mapPdfOcrError, parseJsonResponse } from "@/lib/pdf-client";

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
