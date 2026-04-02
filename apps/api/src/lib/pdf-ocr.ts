type PdfPage = {
  pageNumber: number;
  status: "success" | "partial" | "failed";
  source: "text-layer" | "ocr" | "mixed";
  width: number;
  height: number;
  text?: string;
  markdown?: string;
  html?: string;
  errorCode?: string;
  errorMessage?: string;
  blocks: Array<Record<string, unknown>>;
};

type AssemblePdfDocumentInput = {
  documentId: string;
  fileName: string;
  totalPages: number;
  pages: PdfPage[];
  lockedPages: number;
  remainingPdfPagesToday: number;
  exportToken: string;
};

type PdfRouteOutcomeInput = {
  totalPages: number;
  pages: PdfPage[];
};

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

function countSources(pages: PdfPage[]) {
  return {
    textLayerPages: pages.filter((page) => page.source === "text-layer").length,
    ocrPages: pages.filter((page) => page.source === "ocr").length,
    mixedPages: pages.filter((page) => page.source === "mixed").length,
  };
}

function buildDocumentHtml(input: { title: string; pages: PdfPage[]; lockedPages: number }) {
  const chunks = [`<h1>${input.title}</h1>`];
  for (const page of input.pages.filter((page) => page.status !== "failed")) {
    chunks.push(page.html ?? "");
  }
  if (input.lockedPages > 0) {
    chunks.push(`<p>Locked pages: ${input.lockedPages}</p>`);
  }
  return chunks.join("\n");
}

function buildDocumentMarkdown(input: { pages: PdfPage[]; lockedPages: number }) {
  const chunks = input.pages.filter((page) => page.status !== "failed").map((page) => page.markdown ?? "");
  if (input.lockedPages > 0) {
    chunks.push(`\nLocked pages: ${input.lockedPages}`);
  }
  return chunks.join("\n\n");
}

function buildDocumentText(input: { pages: PdfPage[]; lockedPages: number }) {
  const chunks = input.pages.filter((page) => page.status !== "failed").map((page) => page.text ?? "");
  if (input.lockedPages > 0) {
    chunks.push(`Locked pages: ${input.lockedPages}`);
  }
  return chunks.join("\n\n");
}

function buildPreviewHtml(pages: PdfPage[]) {
  return pages.filter((page) => page.status !== "failed").map((page) => page.html ?? "").join("\n");
}

export function sanitizePreviewHtml(html: string) {
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

export function buildPdfRouteOutcome(input: PdfRouteOutcomeInput) {
  const hasUsablePages = input.pages.some((page) => page.status === "success" || page.status === "partial");
  if (!hasUsablePages) {
    throw new Error("pdf_processing_failed");
  }
  return input.pages;
}

export function assemblePdfDocumentResult(input: AssemblePdfDocumentInput) {
  const successfulPages = input.pages.filter((page) => page.status === "success" || page.status === "partial");
  const failedPages = input.pages
    .filter((page) => page.status === "failed")
    .map((page) => ({ pageNumber: page.pageNumber, errorCode: page.errorCode ?? "unknown", errorMessage: page.errorMessage ?? "Unknown error" }));
  const title = stripExtension(input.fileName);

  return {
    kind: "pdf",
    totalPages: input.totalPages,
    processedPages: successfulPages.length,
    lockedPages: input.lockedPages,
    truncated: input.lockedPages > 0,
    html: buildDocumentHtml({ title, pages: input.pages, lockedPages: input.lockedPages }),
    md: buildDocumentMarkdown({ pages: input.pages, lockedPages: input.lockedPages }),
    txt: buildDocumentText({ pages: input.pages, lockedPages: input.lockedPages }),
    previewHtml: sanitizePreviewHtml(buildPreviewHtml(input.pages)),
    remainingPdfPagesToday: input.remainingPdfPagesToday,
    exportToken: input.exportToken,
    exportManifest: {
      documentId: input.documentId,
      totalPages: input.totalPages,
      processedPageNumbers: successfulPages.map((page) => page.pageNumber),
      failedPageNumbers: failedPages.map((page) => page.pageNumber),
      pageLayouts: input.pages.map((page) => ({
        pageNumber: page.pageNumber,
        source: page.source,
        width: page.width,
        height: page.height,
        blocks: page.blocks,
      })),
      billingUpsell: input.lockedPages > 0
        ? {
            required: true,
            message: "Seu limite gratuito de paginas PDF acabou. Desbloqueie mais paginas quando a cobranca estiver ativa.",
            ctaLabel: "Desbloquear mais paginas",
            ctaHref: "/conta",
          }
        : undefined,
    },
    pageStats: countSources(input.pages),
    failedPages,
    exportSupport: { searchablePdf: true, reflowedPdf: true },
    billingUpsell: input.lockedPages > 0
      ? {
          required: true,
          message: "Seu limite gratuito de paginas PDF acabou. Desbloqueie mais paginas quando a cobranca estiver ativa.",
          ctaLabel: "Desbloquear mais paginas",
          ctaHref: "/conta",
        }
      : undefined,
    pages: input.pages,
  };
}
