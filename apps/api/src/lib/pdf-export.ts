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

export async function buildReflowedPdfPlan(manifest: ExportManifest) {
  return {
    mode: "reflowed" as const,
    blocks: manifest.pageLayouts.flatMap((page) => page.blocks),
  };
}
