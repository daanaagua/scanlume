import { billingUpsellSchema } from "./pdf-schema";

type PdfPageStatus = "success" | "partial" | "failed";

type PdfLockError = Error & {
  status: number;
  code: string;
};

const pdfLocks = new Set<string>();

export function defaultPdfUpsell() {
  return billingUpsellSchema.parse({
    required: true,
    message: "Seu limite gratuito de paginas PDF acabou. Desbloqueie mais paginas quando a cobranca estiver ativa.",
    ctaLabel: "Desbloquear mais paginas",
    ctaHref: "/conta",
  });
}

export function buildPdfAllowance(input: {
  viewerType: "anonymous" | "user";
  totalPages: number;
  remainingCredits?: number;
  remainingPdfPagesToday?: number;
  maxPagesPerDocument?: number;
}) {
  const maxPagesPerDocument = input.maxPagesPerDocument ?? input.totalPages;
  const creditLimitedPages = typeof input.remainingCredits === "number"
    ? Math.floor(Math.max(input.remainingCredits, 0) / 2)
    : Math.max(input.remainingPdfPagesToday ?? 0, 0);
  const processablePages = Math.min(input.totalPages, Math.max(creditLimitedPages, 0), maxPagesPerDocument);

  return {
    totalPages: input.totalPages,
    processablePages,
    lockedPages: Math.max(input.totalPages - processablePages, 0),
    truncated: processablePages < input.totalPages,
    billingUpsell: processablePages < input.totalPages ? defaultPdfUpsell() : undefined,
  };
}

export function countBillablePdfPages(pages: Array<{ status: PdfPageStatus }>) {
  return pages.filter((page) => page.status === "success" || page.status === "partial").length;
}

export async function acquirePdfProcessingLock(input: { lockKey: string }) {
  if (pdfLocks.has(input.lockKey)) {
    const error = new Error("Another PDF job is already running.") as PdfLockError;
    error.status = 409;
    error.code = "pdf_job_in_progress";
    throw error;
  }

  pdfLocks.add(input.lockKey);
  return { lockKey: input.lockKey };
}

export async function releasePdfProcessingLock(lock: { lockKey: string } | null) {
  if (!lock) {
    return;
  }

  pdfLocks.delete(lock.lockKey);
}
