import { PDFDocument } from "pdf-lib";

import { readNumber, sha256Hex, type WorkerEnv } from "./store";

type PdfOcrHttpError = Error & {
  status: number;
  code: string;
  details?: Record<string, unknown>;
};

export function createPdfHttpError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  const error = new Error(message) as PdfOcrHttpError;
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

export async function inspectPdfFile(input: {
  file: File;
  env: WorkerEnv;
}) {
  if (input.file.type !== "application/pdf") {
    throw createPdfHttpError(400, "pdf_file_type_invalid", "Only PDF files are supported.");
  }

  const maxFileMb = readNumber(input.env.PDF_MAX_FILE_MB, 15);
  if (input.file.size > maxFileMb * 1024 * 1024) {
    throw createPdfHttpError(413, "pdf_file_too_large", `The selected PDF exceeds the ${maxFileMb} MB limit.`);
  }

  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const sourceHash = await sha256Hex(Array.from(bytes.slice(0, 2048)).join(",") + `:${bytes.byteLength}`);
  let totalPages = 0;

  try {
    const pdf = await PDFDocument.load(bytes);
    totalPages = pdf.getPageCount();
  } catch {
    throw createPdfHttpError(400, "pdf_invalid", "The uploaded file is not a valid PDF.");
  }

  return {
    bytes,
    totalPages,
    sourceHash,
  };
}

export function parsePreparedPagesJson(raw: string) {
  try {
    return JSON.parse(raw) as unknown[];
  } catch {
    throw createPdfHttpError(400, "pdf_invalid", "pdf_invalid: preparedPages must be valid JSON.");
  }
}

export function validatePreparedPdfPayload(input: {
  claimedTotalPages: number;
  actualTotalPages: number;
  preparedPages: Array<{ pageNumber: number }>;
}) {
  if (input.claimedTotalPages !== input.actualTotalPages) {
    throw createPdfHttpError(
      400,
      "pdf_invalid",
      `pdf_invalid: totalPages ${input.claimedTotalPages} does not match the uploaded PDF page count ${input.actualTotalPages}.`,
      {
        claimedTotalPages: input.claimedTotalPages,
        actualTotalPages: input.actualTotalPages,
      },
    );
  }

  const seen = new Set<number>();
  for (const page of input.preparedPages) {
    if (!Number.isInteger(page.pageNumber) || page.pageNumber <= 0) {
      throw createPdfHttpError(400, "pdf_invalid", `pdf_invalid: prepared page number ${page.pageNumber} must be a positive integer.`);
    }

    if (page.pageNumber > input.actualTotalPages) {
      throw createPdfHttpError(
        400,
        "pdf_invalid",
        `pdf_invalid: prepared page number ${page.pageNumber} is out of range for a ${input.actualTotalPages}-page PDF.`,
        {
          pageNumber: page.pageNumber,
          actualTotalPages: input.actualTotalPages,
        },
      );
    }

    if (seen.has(page.pageNumber)) {
      throw createPdfHttpError(
        400,
        "pdf_invalid",
        `pdf_invalid: duplicate prepared page number ${page.pageNumber}.`,
        { pageNumber: page.pageNumber },
      );
    }

    seen.add(page.pageNumber);
  }
}
