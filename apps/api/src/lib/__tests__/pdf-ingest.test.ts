import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { inspectPdfFile, parsePreparedPagesJson, validatePreparedPdfPayload } from "../pdf-ingest";

function createEnv() {
  return {
    PDF_MAX_FILE_MB: "15",
  };
}

async function createPdfFile(pageCount: number) {
  const pdf = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) {
    pdf.addPage([300, 400]);
  }

  const pdfBytes = await pdf.save();
  const pdfBuffer = new Uint8Array(pdfBytes.byteLength);
  pdfBuffer.set(pdfBytes);
  return new File([pdfBuffer], "sample.pdf", { type: "application/pdf" });
}

describe("parsePreparedPagesJson", () => {
  it("maps invalid preparedPages JSON to a structured pdf_invalid error", () => {
    expect(() => parsePreparedPagesJson("not-json")).toThrowError(/pdf_invalid/);
  });
});

describe("inspectPdfFile", () => {
  it("reads the real page count from the uploaded PDF", async () => {
    const inspection = await inspectPdfFile({
      file: await createPdfFile(3),
      env: createEnv() as never,
    });

    expect(inspection.totalPages).toBe(3);
    expect(inspection.bytes.byteLength).toBeGreaterThan(0);
  });
});

describe("validatePreparedPdfPayload", () => {
  it("accepts unique page numbers that stay inside the real PDF bounds", () => {
    expect(() =>
      validatePreparedPdfPayload({
        claimedTotalPages: 3,
        actualTotalPages: 3,
        preparedPages: [{ pageNumber: 1 }, { pageNumber: 3 }],
      }),
    ).not.toThrow();
  });

  it("rejects a claimed totalPages that does not match the real PDF page count", () => {
    expect(() =>
      validatePreparedPdfPayload({
        claimedTotalPages: 2,
        actualTotalPages: 3,
        preparedPages: [{ pageNumber: 1 }, { pageNumber: 2 }],
      }),
    ).toThrow(/totalPages/i);
  });

  it("rejects duplicate prepared page numbers", () => {
    expect(() =>
      validatePreparedPdfPayload({
        claimedTotalPages: 3,
        actualTotalPages: 3,
        preparedPages: [{ pageNumber: 2 }, { pageNumber: 2 }],
      }),
    ).toThrow(/duplicate/i);
  });

  it("rejects prepared page numbers outside the real PDF bounds", () => {
    expect(() =>
      validatePreparedPdfPayload({
        claimedTotalPages: 3,
        actualTotalPages: 3,
        preparedPages: [{ pageNumber: 4 }],
      }),
    ).toThrow(/out of range/i);
  });
});
