export function buildPdfSelectionSummary(input: {
  totalPages: number;
  remainingPages: number;
  maxPagesPerDocument: number;
}) {
  const processablePages = Math.min(input.totalPages, input.remainingPages, input.maxPagesPerDocument);
  return {
    processablePages,
    lockedPages: Math.max(input.totalPages - processablePages, 0),
    truncated: processablePages < input.totalPages,
  };
}

export function mapPdfOcrError(error: { code: string; error: string; remainingPdfPagesToday: number }) {
  if (error.code === "pdf_job_in_progress") {
    return "Outro PDF ja esta em processamento para esta conta.";
  }
  if (error.code === "pdf_page_limit_reached") {
    return "Seu limite gratuito de paginas PDF acabou.";
  }
  if (error.code === "pdf_invalid") {
    return "O PDF enviado nao pode ser lido.";
  }
  return error.error;
}
