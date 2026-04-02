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
  return {
    bytes,
    totalPages: 0,
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
