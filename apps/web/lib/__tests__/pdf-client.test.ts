import { describe, expect, it } from "vitest";

import { buildPdfSelectionSummary, mapPdfOcrError } from "@/lib/pdf-client";

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
