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

type RegionBounds = { x: number; y: number; width: number; height: number };

type StructuredLayoutBlock = {
  type: string;
  text: string;
  order: number;
};

type RegionDrawBlock = {
  kind: "h1" | "h2" | "p" | "br";
  text: string;
  lines: string[];
  fontSize: number;
  lineHeight: number;
  bbox: RegionBounds;
};

type RegionLayoutSpec = {
  backdrop: RegionBounds;
  drawnBlocks: RegionDrawBlock[];
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

function normalizeKind(value?: string): "h1" | "h2" | "p" | "br" {
  return value === "h1" || value === "h2" || value === "br" ? value : "p";
}

function measureApproximateTextWidth(value: string, fontSize: number) {
  return value.length * fontSize * 0.56;
}

function wrapTokenByCharacters(token: string, maxWidth: number, measure: (value: string) => number) {
  const chunks: string[] = [];
  let current = "";

  for (const character of token) {
    const next = `${current}${character}`;
    if (current && measure(next) > maxWidth) {
      chunks.push(current);
      current = character;
      continue;
    }
    current = next;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function wrapTextForRegion(text: string, maxWidth: number, measure: (value: string) => number) {
  const paragraphs = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    let current = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (measure(word) > maxWidth) {
        if (current) {
          lines.push(current);
          current = "";
        }
        lines.push(...wrapTokenByCharacters(word, maxWidth, measure));
        continue;
      }

      const next = current ? `${current} ${word}` : word;
      if (current && measure(next) > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines.length > 0 ? lines : [text.trim()];
}

function unionBounds(bounds: RegionBounds[]) {
  const left = Math.min(...bounds.map((bbox) => bbox.x));
  const top = Math.min(...bounds.map((bbox) => bbox.y));
  const right = Math.max(...bounds.map((bbox) => bbox.x + bbox.width));
  const bottom = Math.max(...bounds.map((bbox) => bbox.y + bbox.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function regionGroupKey(block: { id?: string }) {
  return block.id?.replace(/-\d+$/, "") ?? crypto.randomUUID();
}

function blockScale(kind: "h1" | "h2" | "p" | "br") {
  if (kind === "h1") return 1.3;
  if (kind === "h2") return 1.15;
  if (kind === "br") return 1;
  return 1;
}

function minimumFont(kind: "h1" | "h2" | "p" | "br") {
  if (kind === "h1") return 8;
  if (kind === "h2") return 7;
  return 6;
}

export function fitBlocksToRegion(input: {
  region: RegionBounds;
  blocks: StructuredLayoutBlock[];
  pageSize?: { width: number; height: number };
  pageLayout?: { width?: number; height?: number };
  font?: PDFFont;
}) {
  const blocks = [...input.blocks].sort((left, right) => left.order - right.order).filter((block) => block.text.trim().length > 0 || block.type === "br");
  const initialBodySize = clampNumber(input.region.height / Math.max(blocks.length * 1.8, 4), 11, 14);
  const measureWithFont = (value: string, size: number) => input.font ? input.font.widthOfTextAtSize(value, size) : measureApproximateTextWidth(value, size);

  const layoutAttempt = (bodySize: number, gap: number, truncate = false) => {
    const laidOut: RegionDrawBlock[] = [];
    let cursorY = input.region.y;

    for (const block of blocks) {
      const kind = normalizeKind(block.type);
      const requestedSize = clampNumber(bodySize * blockScale(kind), minimumFont(kind), 18);
      const lineHeight = Math.max(requestedSize, requestedSize * (kind === "p" ? 1.08 : 1.1));
      const lines = kind === "br"
        ? [""]
        : wrapTextForRegion(block.text, input.region.width, (value) => measureWithFont(value, requestedSize));
      const maxLines = Math.max(1, Math.floor((input.region.y + input.region.height - cursorY) / lineHeight));

      if (!truncate && cursorY + lines.length * lineHeight > input.region.y + input.region.height) {
        return null;
      }

      let visibleLines = lines;
      if (truncate && lines.length > maxLines) {
        visibleLines = lines.slice(0, Math.max(maxLines, 1));
        const lastLine = visibleLines[visibleLines.length - 1] ?? "";
        visibleLines[visibleLines.length - 1] = `${lastLine.replace(/\.{3}$/, "")}...`;
      }

      const blockHeight = Math.min(visibleLines.length * lineHeight, Math.max(input.region.y + input.region.height - cursorY, lineHeight));
      laidOut.push({
        kind,
        text: block.text,
        lines: visibleLines,
        fontSize: requestedSize,
        lineHeight,
        bbox: {
          x: input.region.x,
          y: cursorY,
          width: input.region.width,
          height: blockHeight,
        },
      });

      cursorY += blockHeight + gap;
      if (cursorY > input.region.y + input.region.height) {
        return laidOut;
      }
    }

    return laidOut;
  };

  for (let bodySize = initialBodySize; bodySize >= 6; bodySize -= 0.5) {
    const attempt = layoutAttempt(bodySize, 4, false);
    if (attempt) {
      return { blocks: attempt };
    }
  }

  const truncated = layoutAttempt(6, 2, true) ?? [];
  return { blocks: truncated };
}

export function buildSearchableRegionLayoutSpec(input: {
  region: RegionBounds;
  blocks: StructuredLayoutBlock[];
  pageSize?: { width: number; height: number };
  pageLayout?: { width?: number; height?: number };
  font?: PDFFont;
}) {
  const region = input.pageSize
    ? {
        x: scaleX(input.region.x, input.pageLayout?.width, input.pageSize.width),
        y: ((input.region.y) / Math.max(input.pageLayout?.height ?? input.pageSize.height, 1)) * input.pageSize.height,
        width: scaleX(input.region.width, input.pageLayout?.width, input.pageSize.width),
        height: (input.region.height / Math.max(input.pageLayout?.height ?? input.pageSize.height, 1)) * input.pageSize.height,
      }
    : input.region;

  return {
    backdrop: region,
    drawnBlocks: fitBlocksToRegion({
      region,
      blocks: input.blocks,
      pageLayout: input.pageLayout,
      pageSize: input.pageSize,
      font: input.font,
    }).blocks,
  } satisfies RegionLayoutSpec;
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
  const spec = buildSearchableRegionLayoutSpec({
    region: bbox,
    blocks: [{ type: "p", text, order: 0 }],
    pageLayout: input.pageLayout,
    pageSize: input.pageSize,
    font: input.font,
  });
  const firstBlock = spec.drawnBlocks[0];
  if (!firstBlock) {
    return null;
  }

  return {
    text,
    x: Math.max(0, firstBlock.bbox.x),
    y: input.pageSize.height - firstBlock.bbox.y - firstBlock.fontSize,
    maxWidth: firstBlock.bbox.width,
    size: firstBlock.fontSize,
    lineHeight: firstBlock.lineHeight,
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

    const overlayBlocks = filterOverlappingOcrBlocks(pageLayout.blocks).filter(
      (block) => block.source === "ocr" && typeof block.text === "string" && block.text.trim().length > 0 && block.bbox,
    );
    if (overlayBlocks.length === 0) {
      continue;
    }

    const size = page.getSize();
    const groups = new Map<string, typeof overlayBlocks>();
    for (const block of overlayBlocks) {
      const key = regionGroupKey(block);
      const group = groups.get(key) ?? [];
      group.push(block);
      groups.set(key, group);
    }

    for (const group of groups.values()) {
      const region = unionBounds(group.map((block) => block.bbox as RegionBounds));
      const spec = buildSearchableRegionLayoutSpec({
        region,
        blocks: group
          .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
          .map((block) => ({ type: block.kind ?? "p", text: block.text ?? "", order: block.order ?? 0 })),
        pageLayout,
        pageSize: size,
        font,
      });

      page.drawRectangle({
        x: spec.backdrop.x,
        y: size.height - spec.backdrop.y - spec.backdrop.height,
        width: spec.backdrop.width,
        height: spec.backdrop.height,
        color: rgb(1, 1, 1),
      });

      for (const block of spec.drawnBlocks) {
        page.drawText(block.lines.join("\n"), {
          x: block.bbox.x,
          y: size.height - block.bbox.y - block.fontSize,
          maxWidth: block.bbox.width,
          size: block.fontSize,
          lineHeight: block.lineHeight,
          font,
          color: rgb(0.08, 0.1, 0.14),
        });
      }
    }
  }

  return new Uint8Array(await pdf.save({ useObjectStreams: false }));
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
  for (const pageLayout of manifest.pageLayouts) {
    const pageWidth = pageLayout.width ?? 595;
    const pageHeight = pageLayout.height ?? 842;
    const page = pdf.addPage([pageWidth, pageHeight]);
    const contentBlocks = pageLayout.blocks.filter((block) => (block.text?.trim() ?? "").length > 0 && block.bbox);
    const groups = new Map<string, typeof contentBlocks>();

    for (const block of contentBlocks) {
      const key = block.source === "ocr" ? regionGroupKey(block) : `${block.source ?? "text"}-${block.id ?? block.order ?? 0}`;
      const group = groups.get(key) ?? [];
      group.push(block);
      groups.set(key, group);
    }

    for (const group of [...groups.values()].sort((left, right) => ((left[0]?.bbox?.y ?? 0) - (right[0]?.bbox?.y ?? 0)))) {
      const region = unionBounds(group.map((block) => block.bbox as RegionBounds));
      const spec = buildSearchableRegionLayoutSpec({
        region,
        blocks: group.map((block) => ({ type: block.kind ?? "p", text: block.text ?? "", order: block.order ?? 0 })),
        font,
      });

      for (const block of spec.drawnBlocks) {
        const activeFont = block.kind === "h1" || block.kind === "h2" ? titleFont : font;
        page.drawText(block.lines.join("\n"), {
          x: block.bbox.x,
          y: pageHeight - block.bbox.y - block.fontSize,
          maxWidth: block.bbox.width,
          size: block.fontSize,
          lineHeight: block.lineHeight,
          font: activeFont,
          color: rgb(0.08, 0.1, 0.14),
        });
      }
    }
  }

  return new Uint8Array(await pdf.save({ useObjectStreams: false }));
}
