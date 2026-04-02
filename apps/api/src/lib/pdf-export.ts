import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";

import { sha256Hex } from "./store";

type ExportManifest = {
  totalPages?: number;
  failedPageNumbers?: number[];
  pageLayouts: Array<{
    pageNumber: number;
    source?: "text-layer" | "ocr" | "mixed";
    width?: number;
    height?: number;
    blocks: Array<{
      kind?: string;
      text?: string;
      source?: "text-layer" | "ocr";
      bbox?: { x: number; y: number; width: number; height: number };
    }>;
  }>;
};

type TokenInput = {
  sourceHash: string;
  exportManifestHash: string;
  processedPageNumbers: number[];
  expiresAt: number;
  secret: string;
};

type VerifyInput = {
  sourceHash: string;
  exportManifestHash: string;
  now: number;
  secret: string;
};

function intersects(
  left?: { x: number; y: number; width: number; height: number },
  right?: { x: number; y: number; width: number; height: number },
) {
  if (!left || !right) {
    return false;
  }

  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  );
}

export async function signPdfExportToken(input: TokenInput) {
  const payload = JSON.stringify({
    sourceHash: input.sourceHash,
    exportManifestHash: input.exportManifestHash,
    processedPageNumbers: input.processedPageNumbers,
    expiresAt: input.expiresAt,
  });
  const signature = await sha256Hex(`${input.secret}:${payload}`);
  return `${btoa(payload)}.${signature}`;
}

export async function verifyPdfExportToken(token: string, input: VerifyInput) {
  const [payloadBase64, signature] = token.split(".");
  const payload = atob(payloadBase64 ?? "");
  const expected = await sha256Hex(`${input.secret}:${payload}`);
  if (signature !== expected) {
    throw new Error("token invalid");
  }

  const parsed = JSON.parse(payload) as {
    sourceHash: string;
    exportManifestHash: string;
    expiresAt: number;
  };

  if (parsed.expiresAt < input.now) {
    throw new Error("token expired");
  }
  if (parsed.sourceHash !== input.sourceHash) {
    throw new Error("source mismatch");
  }
  if (parsed.exportManifestHash !== input.exportManifestHash) {
    throw new Error("manifest mismatch");
  }
}

export function mapPdfExportError(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown";
  if (message.includes("token")) {
    return { ok: false as const, status: 400, code: "pdf_export_token_invalid", error: "Invalid export token." };
  }
  if (message.includes("manifest")) {
    return { ok: false as const, status: 400, code: "pdf_export_manifest_invalid", error: "Invalid export manifest." };
  }
  if (message.includes("source")) {
    return { ok: false as const, status: 400, code: "pdf_export_source_mismatch", error: "The uploaded PDF does not match the signed export request." };
  }
  return { ok: false as const, status: 502, code: "pdf_export_generation_failed", error: "Failed to generate the requested PDF export." };
}

export function streamPdfResponse(content: Uint8Array, filename: string) {
  return new Response(new Blob([Uint8Array.from(content)], { type: "application/pdf" }), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export function buildExportRouteConfig(kind: "searchable" | "reflowed") {
  return {
    endpoint: kind === "searchable" ? "/v1/pdf/export/searchable" : "/v1/pdf/export/reflowed",
    contentType: "application/pdf",
  };
}

export function filterOverlappingOcrBlocks<T extends { source?: "text-layer" | "ocr"; bbox?: { x: number; y: number; width: number; height: number } }>(blocks: T[]) {
  const nativeBlocks = blocks.filter((block) => block.source === "text-layer");
  return blocks.filter((block) => {
    if (block.source !== "ocr") {
      return true;
    }
    return !nativeBlocks.some((nativeBlock) => intersects(nativeBlock.bbox, block.bbox));
  });
}

export async function buildSearchablePdfPlan(manifest: ExportManifest) {
  return {
    mode: "searchable" as const,
    pages: manifest.pageLayouts.map((page) => ({
      pageNumber: page.pageNumber,
      mode: page.source === "text-layer" ? "passthrough" : (manifest.failedPageNumbers ?? []).includes(page.pageNumber) ? "visual-only" : "overlay",
      overlayRegions: filterOverlappingOcrBlocks(page.blocks).filter((block) => block.source === "ocr"),
    })),
  };
}

function scaleX(x: number, sourceWidth: number | undefined, targetWidth: number) {
  if (!sourceWidth || sourceWidth <= 0) {
    return x;
  }
  return (x / sourceWidth) * targetWidth;
}

function scaleY(y: number, height: number, sourceHeight: number | undefined, targetHeight: number) {
  if (!sourceHeight || sourceHeight <= 0) {
    return targetHeight - y - height;
  }
  return targetHeight - ((y + height) / sourceHeight) * targetHeight;
}

function wrapTextByWords(text: string, maxChars = 90) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      continue;
    }
    current = next;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [text.trim()];
}

function wrapTextToWidth(text: string, maxWidth: number, measure: (value: string) => number) {
  const result: string[] = [];
  for (const paragraph of text.split(/\n+/).map((line) => line.trim()).filter(Boolean)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (current && measure(next) > maxWidth) {
        result.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) {
      result.push(current);
    }
    result.push("");
  }

  if (result[result.length - 1] === "") {
    result.pop();
  }
  return result;
}

function splitOverlayTextLines(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function buildSearchableOverlayDrawSpec(input: {
  block: { text?: string; bbox?: { x: number; y: number; width: number; height: number } };
  pageLayout: { width?: number; height?: number };
  pageSize: { width: number; height: number };
  font: PDFFont;
}) {
  const text = input.block.text?.trim();
  const bbox = input.block.bbox;
  if (!text || !bbox) {
    return null;
  }

  const width = Math.max(24, scaleX(bbox.width, input.pageLayout.width, input.pageSize.width));
  const height = Math.max(12, (bbox.height / Math.max(input.pageLayout.height ?? input.pageSize.height, 1)) * input.pageSize.height);
  const top = (bbox.y / Math.max(input.pageLayout.height ?? input.pageSize.height, 1)) * input.pageSize.height;
  const x = scaleX(bbox.x, input.pageLayout.width, input.pageSize.width);
  const lines = splitOverlayTextLines(text);
  if (lines.length === 0) {
    return null;
  }

  let fontSize = clampNumber((height / lines.length) * 0.8, 5, 18);
  const widestLine = Math.max(...lines.map((line) => input.font.widthOfTextAtSize(line, fontSize)), 0);
  if (widestLine > width) {
    fontSize = Math.max(4.5, fontSize * (width / widestLine));
  }

  let lineHeight = lines.length === 1 ? fontSize * 1.05 : Math.min(height / lines.length, fontSize * 1.15);
  if (lineHeight < fontSize) {
    lineHeight = fontSize;
  }

  const totalTextHeight = fontSize + lineHeight * Math.max(lines.length - 1, 0);
  if (totalTextHeight > height && totalTextHeight > 0) {
    const shrinkRatio = height / totalTextHeight;
    fontSize = Math.max(4.5, fontSize * shrinkRatio);
    lineHeight = Math.max(fontSize, lineHeight * shrinkRatio);
  }

  return {
    text: lines.join("\n"),
    x: Math.max(0, x),
    y: input.pageSize.height - top - fontSize,
    maxWidth: width,
    size: fontSize,
    lineHeight,
  };
}

export async function buildSearchablePdfBytes(sourceBytes: Uint8Array, manifest: ExportManifest) {
  const pdf = await PDFDocument.load(sourceBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  for (const pageLayout of manifest.pageLayouts) {
    const page = pdf.getPages()[pageLayout.pageNumber - 1];
    if (!page) {
      continue;
    }

    const overlayBlocks = filterOverlappingOcrBlocks(pageLayout.blocks)
      .filter((block) => block.source === "ocr" && typeof block.text === "string" && block.text.trim().length > 0);
    if (overlayBlocks.length === 0) {
      continue;
    }

    const size = page.getSize();
    for (const block of overlayBlocks) {
      const drawSpec = buildSearchableOverlayDrawSpec({
        block,
        pageLayout,
        pageSize: size,
        font,
      });
      if (!drawSpec) {
        continue;
      }

      page.drawText(drawSpec.text, {
        x: Math.max(0, drawSpec.x),
        y: Math.max(0, drawSpec.y),
        maxWidth: Math.max(24, Math.min(drawSpec.maxWidth, size.width)),
        size: drawSpec.size,
        lineHeight: drawSpec.lineHeight,
        font,
        color: rgb(1, 1, 1),
        opacity: 0.01,
      });
    }
  }

  return new Uint8Array(await pdf.save());
}

export async function buildReflowedPdfPlan(manifest: ExportManifest) {
  return {
    mode: "reflowed" as const,
    blocks: manifest.pageLayouts.flatMap((page) => page.blocks),
  };
}

export async function buildReflowedPdfBytes(manifest: ExportManifest) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 48;
  const bodySize = 12;
  const bodyLineHeight = 18;
  const headingSize = 16;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;

  const ensureSpace = (required: number) => {
    if (cursorY - required >= margin) {
      return;
    }
    page = pdf.addPage([pageWidth, pageHeight]);
    cursorY = pageHeight - margin;
  };

  const drawLines = (lines: string[], size: number, lineHeight: number, bold = false) => {
    const activeFont = bold ? titleFont : font;
    for (const line of lines) {
      ensureSpace(lineHeight);
      if (line) {
        page.drawText(line, {
          x: margin,
          y: cursorY,
          size,
          lineHeight,
          font: activeFont,
          color: rgb(0.07, 0.09, 0.12),
        });
      }
      cursorY -= lineHeight;
    }
  };

  for (const pageLayout of manifest.pageLayouts) {
    const blocks = pageLayout.blocks.filter((block) => (block.text?.trim() ?? "").length > 0);
    for (const block of blocks) {
      const text = block.text?.trim() ?? "";
      const isPrimaryHeading = block.kind === "h1";
      const isSecondaryHeading = block.kind === "h2";
      const fontSize = isPrimaryHeading ? 18 : isSecondaryHeading ? 15 : bodySize;
      const lineHeight = isPrimaryHeading ? 24 : isSecondaryHeading ? 21 : bodyLineHeight;
      const wrapped = wrapTextToWidth(
        text,
        pageWidth - margin * 2,
        (value) => (isPrimaryHeading || isSecondaryHeading ? titleFont.widthOfTextAtSize(value, fontSize) : font.widthOfTextAtSize(value, fontSize)),
      );
      drawLines(wrapped.length > 0 ? wrapped : [text], fontSize, lineHeight, isPrimaryHeading || isSecondaryHeading);
      cursorY -= isPrimaryHeading ? 10 : isSecondaryHeading ? 8 : 6;
    }

    cursorY -= 14;
  }

  return new Uint8Array(await pdf.save());
}
