"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AuthDialog } from "@/components/auth-dialog";
import { getOrCreateBrowserId } from "@/lib/browser-id";
import { downloadBatchZip, downloadHtmlFile, downloadTextFile, requestPdfExport } from "@/lib/downloads";
import { buildPdfSelectionSummary, mapPdfOcrError, parseJsonResponse } from "@/lib/pdf-client";
import { buildPreparedPdfPages, readPdfPageCount } from "@/lib/pdf-renderer";
import { API_BASE_URL, FORMATTED_MODE_LABEL, SIMPLE_MODE_LABEL } from "@/lib/site";
import { announceUsageRefresh } from "@/lib/usage-sync";

type Mode = "simple" | "formatted";
type FormatTab = "txt" | "md" | "html";
type DocumentKind = "image" | "pdf";
type OcrLanguage = "auto" | "pt" | "en" | "es";
type WorkspaceLocale = "pt-BR" | "en";

type SelectedFile = {
  id: string;
  file: File;
  kind: DocumentKind;
  pageCount?: number;
  previewUrl?: string;
};

type ImageResultPayload = {
  kind: "image";
  txt: string;
  md?: string;
  html?: string;
  preview: string;
};

type PdfResultPayload = {
  kind: "pdf";
  totalPages: number;
  processedPages: number;
  lockedPages: number;
  html: string;
  md: string;
  txt: string;
  previewHtml: string;
  remainingPdfPagesToday: number;
  exportToken: string;
  exportManifest: object;
  pageStats: {
    textLayerPages: number;
    ocrPages: number;
    mixedPages: number;
  };
  failedPages: Array<{
    pageNumber: number;
    errorCode: string;
    errorMessage: string;
  }>;
  billingUpsell?: {
    required: boolean;
    message: string;
    ctaLabel: string;
    ctaHref: string;
  };
};

type ResultPayload = ImageResultPayload | PdfResultPayload;

type FileResult = {
  status: "idle" | "processing" | "success" | "error";
  message?: string;
  payload?: ResultPayload;
};

type WorkspaceCopy = {
  toolEyebrow: string;
  toolTitle: string;
  toolIntro: string;
  inputAria: string;
  inputEyebrow: string;
  uploadTitle: string;
  uploadTitlePriority: string;
  uploadSummary: string;
  uploadSummaryPriority: string;
  modeAria: string;
  languageLabel: string;
  languageAria: string;
  languageOptions: Record<OcrLanguage, string>;
  dropFormatted: string;
  dropSimple: string;
  or: string;
  selectFile: string;
  startSimple: string;
  startFormatted: string;
  processing: string;
  processingHint: string;
  queueTitle: string;
  queueEmpty: string;
  fileColumn: string;
  pagesColumn: string;
  modeColumn: string;
  statusColumn: string;
  progressColumn: string;
  actionsColumn: string;
  status: Record<FileResult["status"], string>;
  retry: string;
  downloadResult: string;
  removeFile: (name: string) => string;
  resultTitle: string;
  clearResults: string;
  clear: string;
  previewEmpty: string;
  copyText: string;
  downloadAs: string;
  restoreOriginal: string;
  editorLabel: (format: FormatTab) => string;
  pdfTotal: (count: number) => string;
  pdfProcessed: (count: number) => string;
  pdfNativeText: (count: number) => string;
  pdfOcr: (count: number) => string;
  pdfMixed: (count: number) => string;
  searchablePdf: string;
  reflowedPdf: string;
  batchZip: string;
  pdfFormattedOnly: string;
  readError: string;
  imageProcessError: string;
  unexpectedError: string;
  mixedFiles: string;
  unsupportedFile: string;
  imageOnly: string;
  maxImages: (count: number) => string;
  maxBatchTotal: (mb: number) => string;
  maxImage: (mb: number) => string;
  maxPdf: (mb: number) => string;
  uploadLimit: (mode: Mode, maxImageMb: number, maxBatchTotalMb: number, maxPdfMb: number) => string;
  maxFilesSuffix: (count: number) => string;
  progressComplete: (completed: number, total: number) => string;
  progressProcessing: (index: number, total: number) => string;
  progressReady: (total: number) => string;
  creditsLabel: string;
  modeBadgeSimple: string;
  modeBadgeFormatted: string;
  authenticatedFootnote: string;
  anonymousFootnote: string;
};

type ProgressSummary = {
  activeFileNumber: number;
  completedCount: number;
  label: string;
  percent: number;
  totalCount: number;
};

type ProcessingState = {
  fileId: string;
  startedAt: number;
};

const DISPLAY_DAILY_BUDGET_BRL = 20;
const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getCurrentFileProgress(elapsedMs: number) {
  if (elapsedMs <= 0) {
    return 0.04;
  }

  if (elapsedMs <= 1800) {
    return 0.04 + ((0.35 - 0.04) * elapsedMs) / 1800;
  }

  if (elapsedMs <= 11000) {
    return 0.35 + ((0.9 - 0.35) * (elapsedMs - 1800)) / 9200;
  }

  return Math.min(0.99, 0.9 + ((0.99 - 0.9) * (elapsedMs - 11000)) / 20000);
}

type LimitsResponse = {
  viewer: {
    authenticated: boolean;
    type: "anonymous" | "user";
    user?: {
      id: string;
      email: string;
      name: string;
      avatarUrl: string | null;
      emailVerified: boolean;
      emailVerifiedAt: string | null;
      hasPassword: boolean;
      authProviders: string[];
    } | null;
  };
  plan: {
    id: string;
    label: string;
    shortLabel: string;
  };
  limits: {
    dailyImages: number;
    dailyCredits: number;
    maxImageMb: number;
    maxBatchFiles: number;
    maxBatchTotalMb: number;
    softBudgetRmb: number;
    hardBudgetRmb: number;
    pdf: {
      maxFileMb: number;
      maxPagesPerDocument: number;
      requestPageLimitAnonymous: number;
      dailyPageLimitLoggedIn: number;
      remainingPages: number;
    };
  };
  budget: {
    totalCostRmb: number;
  };
  usage: {
    usedImages: number;
    usedCredits: number;
    remainingImages: number;
    remainingCredits: number;
  };
  status: {
    softStopped: boolean;
    hardStopped: boolean;
  };
};

async function fetchLimits(browserId: string) {
  const response = await fetch(`${API_BASE_URL}/v1/limits?browserId=${encodeURIComponent(browserId)}`, {
    credentials: "include",
  });

  return response.json() as Promise<LimitsResponse>;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function baseName(filename: string) {
  return filename.replace(/\.[^.]+$/, "") || "resultado";
}

function revokePreviewUrls(files: SelectedFile[]) {
  files.forEach((file) => {
    if (file.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }
  });
}

const WORKSPACE_COPY: Record<WorkspaceLocale, WorkspaceCopy> = {
  "pt-BR": {
    toolEyebrow: "Ferramenta principal",
    toolTitle: "Upload instantaneo com previa e download.",
    toolIntro: `${SIMPLE_MODE_LABEL} entrega texto puro. ${FORMATTED_MODE_LABEL} reorganiza titulos, paragrafos e a estrutura principal para Word, Markdown e HTML.`,
    inputAria: "Entrada de arquivos",
    inputEyebrow: "Entrada",
    uploadTitle: "Escolha os arquivos",
    uploadTitlePriority: "Upload rapido",
    uploadSummary: "JPG, PNG, screenshot ou PDF no modo formatado.",
    uploadSummaryPriority: "Solte arquivos aqui para iniciar.",
    modeAria: "Modo OCR",
    languageLabel: "Idioma OCR",
    languageAria: "Idioma OCR",
    languageOptions: {
      auto: "Detectar",
      pt: "Portugues",
      en: "Ingles",
      es: "Espanhol",
    },
    dropFormatted: "Solte imagem ou PDF",
    dropSimple: "Solte imagens",
    or: "ou",
    selectFile: "Selecionar arquivo",
    startSimple: `Iniciar ${SIMPLE_MODE_LABEL}`,
    startFormatted: `Iniciar ${FORMATTED_MODE_LABEL}`,
    processing: "Reconhecendo...",
    processingHint: "Pode levar alguns segundos. Mantenha esta aba aberta.",
    queueTitle: "Fila de arquivos",
    queueEmpty: "Nenhum arquivo na fila. Arraste ou selecione uma imagem ou PDF acima para começar.",
    fileColumn: "Arquivo",
    pagesColumn: "Páginas",
    modeColumn: "Modo",
    statusColumn: "Status",
    progressColumn: "Progresso",
    actionsColumn: "Ações",
    status: {
      idle: "Aguardando",
      processing: "Processando",
      success: "Concluído",
      error: "Erro",
    },
    retry: "Tentar novamente",
    downloadResult: "Baixar resultado",
    removeFile: (name) => `Remover ${name}`,
    resultTitle: "Resultado",
    clearResults: "Limpar resultados",
    clear: "Limpar",
    previewEmpty: "O texto extraído aparecerá aqui após o processamento.",
    copyText: "Copiar texto",
    downloadAs: "Baixar como",
    restoreOriginal: "Restaurar original",
    editorLabel: (format) => `Editar ${format.toUpperCase()}`,
    pdfTotal: (count) => `${count} paginas no total`,
    pdfProcessed: (count) => `${count} paginas processadas`,
    pdfNativeText: (count) => `Texto nativo: ${count}`,
    pdfOcr: (count) => `OCR: ${count}`,
    pdfMixed: (count) => `Misto: ${count}`,
    searchablePdf: "Baixar PDF pesquisavel",
    reflowedPdf: "Baixar PDF reorganizado",
    batchZip: "Baixar lote ZIP",
    pdfFormattedOnly: "PDFs so podem ser processados no modo Texto formatado.",
    readError: "Nao foi possivel ler o arquivo.",
    imageProcessError: "Falha ao processar a imagem.",
    unexpectedError: "Erro inesperado.",
    mixedFiles: "Nao misture imagens e PDF no mesmo envio.",
    unsupportedFile: "Envie imagens ou um unico PDF.",
    imageOnly: "Envie apenas imagens JPG, PNG, WEBP ou formatos equivalentes.",
    maxImages: (count) => `Selecione no maximo ${count} imagens por lote.`,
    maxBatchTotal: (mb) => `O lote total deve ficar abaixo de ${mb} MB.`,
    maxImage: (mb) => `Cada imagem precisa ter no maximo ${mb} MB.`,
    maxPdf: (mb) => `Cada PDF precisa ter no maximo ${mb} MB.`,
    uploadLimit: (selectedMode, maxImageMb, maxBatchTotalMb, maxPdfMb) =>
      selectedMode === "formatted"
        ? `Imagem ate ${maxImageMb} MB; PDF ate ${maxPdfMb} MB.`
        : `Imagem ate ${maxImageMb} MB; lote ate ${maxBatchTotalMb} MB.`,
    maxFilesSuffix: (count) => `${count} arquivo(s) por envio.`,
    progressComplete: (completed, total) => `${completed} de ${total} arquivo(s) concluido(s).`,
    progressProcessing: (index, total) => `Processando arquivo ${index} de ${total}...`,
    progressReady: (total) => `${total} arquivo(s) pronto(s). Clique em iniciar para processar.`,
    creditsLabel: "Créditos",
    modeBadgeSimple: "OCR simples",
    modeBadgeFormatted: "Texto formatado",
    authenticatedFootnote: "OCR simples = 1 credito. Texto formatado = 2 credits. PDF = 2 credits por pagina.",
    anonymousFootnote: "Teste anonimo: 5 credits. Conta gratis libera 50 credits totais.",
  },
  en: {
    toolEyebrow: "Main tool",
    toolTitle: "Instant upload with preview and download.",
    toolIntro: "Simple OCR returns plain text. Formatted Text keeps the main headings, paragraphs, and reading structure for Word, Markdown, and HTML.",
    inputAria: "File input",
    inputEyebrow: "Input",
    uploadTitle: "Choose files",
    uploadTitlePriority: "Quick upload",
    uploadSummary: "JPG, PNG, screenshot, or PDF in formatted mode.",
    uploadSummaryPriority: "Drop files here to start.",
    modeAria: "OCR mode",
    languageLabel: "OCR language",
    languageAria: "OCR language",
    languageOptions: {
      auto: "Auto detect",
      pt: "Portuguese",
      en: "English",
      es: "Spanish",
    },
    dropFormatted: "Drop an image or PDF",
    dropSimple: "Drop images",
    or: "or",
    selectFile: "Select file",
    startSimple: "Start Simple OCR",
    startFormatted: "Start Formatted Text",
    processing: "Recognizing...",
    processingHint: "This can take a few seconds. Keep this tab open.",
    queueTitle: "File queue",
    queueEmpty: "No files queued. Drag or select an image or PDF above to begin.",
    fileColumn: "File",
    pagesColumn: "Pages",
    modeColumn: "Mode",
    statusColumn: "Status",
    progressColumn: "Progress",
    actionsColumn: "Actions",
    status: {
      idle: "Waiting",
      processing: "Processing",
      success: "Done",
      error: "Error",
    },
    retry: "Try again",
    downloadResult: "Download result",
    removeFile: (name) => `Remove ${name}`,
    resultTitle: "Result",
    clearResults: "Clear results",
    clear: "Clear",
    previewEmpty: "Extracted text will appear here after processing.",
    copyText: "Copy text",
    downloadAs: "Download as",
    restoreOriginal: "Restore original",
    editorLabel: (format) => `Edit ${format.toUpperCase()}`,
    pdfTotal: (count) => `${count} pages total`,
    pdfProcessed: (count) => `${count} pages processed`,
    pdfNativeText: (count) => `Native text: ${count}`,
    pdfOcr: (count) => `OCR: ${count}`,
    pdfMixed: (count) => `Mixed: ${count}`,
    searchablePdf: "Download searchable PDF",
    reflowedPdf: "Download reflowed PDF",
    batchZip: "Download ZIP batch",
    pdfFormattedOnly: "PDFs can only be processed in Formatted Text mode.",
    readError: "The file could not be read.",
    imageProcessError: "The image could not be processed.",
    unexpectedError: "Unexpected error.",
    mixedFiles: "Do not mix images and PDF in the same upload.",
    unsupportedFile: "Upload images or one PDF.",
    imageOnly: "Upload only JPG, PNG, WEBP, or equivalent image files.",
    maxImages: (count) => `Select at most ${count} images per batch.`,
    maxBatchTotal: (mb) => `The full batch must stay under ${mb} MB.`,
    maxImage: (mb) => `Each image must be at most ${mb} MB.`,
    maxPdf: (mb) => `Each PDF must be at most ${mb} MB.`,
    uploadLimit: (selectedMode, maxImageMb, maxBatchTotalMb, maxPdfMb) =>
      selectedMode === "formatted"
        ? `Image up to ${maxImageMb} MB; PDF up to ${maxPdfMb} MB.`
        : `Image up to ${maxImageMb} MB; batch up to ${maxBatchTotalMb} MB.`,
    maxFilesSuffix: (count) => `${count} file(s) per upload.`,
    progressComplete: (completed, total) => `${completed} of ${total} file(s) completed.`,
    progressProcessing: (index, total) => `Processing file ${index} of ${total}...`,
    progressReady: (total) => `${total} file(s) ready. Start OCR to process.`,
    creditsLabel: "Credits",
    modeBadgeSimple: "Simple OCR",
    modeBadgeFormatted: "Formatted Text",
    authenticatedFootnote: "Simple OCR = 1 credit. Formatted Text = 2 credits. PDF = 2 credits per page.",
    anonymousFootnote: "Anonymous trial: 5 credits. A free account unlocks 50 total credits.",
  },
};

type OcrWorkspaceProps = {
  defaultMode?: Mode;
  locale?: WorkspaceLocale;
  priorityLayout?: boolean;
};

export function OcrWorkspace({ defaultMode = "simple", locale = "pt-BR", priorityLayout = false }: OcrWorkspaceProps) {
  const copy = WORKSPACE_COPY[locale];
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [ocrLanguage, setOcrLanguage] = useState<OcrLanguage>("auto");
  const [activeFormat, setActiveFormat] = useState<FormatTab>("txt");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [results, setResults] = useState<Record<string, FileResult>>({});
  const [editedResults, setEditedResults] = useState<Record<string, Partial<Record<FormatTab, string>>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [limits, setLimits] = useState<LimitsResponse | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isPricingHintOpen, setIsPricingHintOpen] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState | null>(null);
  const [progressTick, setProgressTick] = useState(() => Date.now());
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const browserId = useRef("browser-id-pending");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFilesRef = useRef<SelectedFile[]>([]);

  async function refreshLimits() {
    try {
      const data = await fetchLimits(browserId.current);
      setLimits(data);
    } catch {
      return null;
    }
  }

  useEffect(() => {
    browserId.current = getOrCreateBrowserId();
    void refreshLimits();
  }, []);

  useEffect(() => {
    if (mode === "simple" && activeFormat !== "txt") {
      setActiveFormat("txt");
    }
  }, [mode, activeFormat]);

  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  useEffect(
    () => () => {
      revokePreviewUrls(selectedFilesRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!isSubmitting || !processingState) {
      return;
    }

    const timer = window.setInterval(() => {
      setProgressTick(Date.now());
    }, 120);

    return () => window.clearInterval(timer);
  }, [isSubmitting, processingState]);

  const completedItems = useMemo(
    () =>
      selectedFiles
        .map((entry) => ({ entry, result: results[entry.id] }))
        .filter((entry) => entry.result?.status === "success" && entry.result.payload),
    [results, selectedFiles],
  );

  const progressSummary = useMemo<ProgressSummary | null>(() => {
    if (selectedFiles.length === 0) {
      return null;
    }

    const statuses = selectedFiles.map((file) => results[file.id]?.status ?? "idle");
    const completedCount = statuses.filter((status) => status === "success" || status === "error").length;
    const totalCount = selectedFiles.length;

    if (completedCount === totalCount && totalCount > 0) {
      return {
        activeFileNumber: totalCount,
        completedCount,
        totalCount,
        percent: 100,
        label: copy.progressComplete(completedCount, totalCount),
      };
    }

    const processingIndex = processingState
      ? selectedFiles.findIndex((file) => file.id === processingState.fileId)
      : statuses.findIndex((status) => status === "processing");

    if (isSubmitting && processingIndex >= 0) {
      const elapsedMs = Math.max(progressTick - (processingState?.startedAt ?? progressTick), 0);
      const perFileProgress = getCurrentFileProgress(elapsedMs);

      return {
        activeFileNumber: processingIndex + 1,
        completedCount,
        totalCount,
        percent: clamp(Math.round(((completedCount + perFileProgress) / totalCount) * 100), 3, 99),
        label: copy.progressProcessing(processingIndex + 1, totalCount),
      };
    }

    return {
      activeFileNumber: 0,
      completedCount,
      totalCount,
      percent: completedCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      label: copy.progressReady(totalCount),
    };
  }, [copy, isSubmitting, processingState, progressTick, results, selectedFiles]);

  useEffect(() => {
    if (!progressSummary || progressSummary.percent === 0) {
      setAnimatedPercent(0);
      return;
    }

    if (progressSummary.percent >= 100) {
      setAnimatedPercent(100);
      return;
    }

    const target = progressSummary.percent;
    const timer = window.setInterval(() => {
      setAnimatedPercent((current) => {
        if (current > target) {
          return target;
        }

        if (target - current < 0.4) {
          return target;
        }

        const step = target - current > 16 ? 2.4 : target - current > 7 ? 1.2 : 0.55;
        return Math.min(target, Number((current + step).toFixed(2)));
      });
    }, 90);

    return () => window.clearInterval(timer);
  }, [progressSummary]);

  function validateFiles(files: File[], selectedMode: Mode) {
    const maxFiles = limits?.limits.maxBatchFiles ?? 10;
    const maxImageMb = limits?.limits.maxImageMb ?? 5;
    const maxBatchTotalMb = limits?.limits.maxBatchTotalMb ?? 20;
    const maxPdfMb = limits?.limits.pdf.maxFileMb ?? 15;
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    const kinds = new Set(files.map((file) => (file.type === "application/pdf" ? "pdf" : file.type.startsWith("image/") ? "image" : "other")));

    if (kinds.has("other")) {
      return copy.unsupportedFile;
    }

    if (kinds.size > 1) {
      return copy.mixedFiles;
    }

    if (kinds.has("pdf")) {
      if (selectedMode !== "formatted") {
        return copy.pdfFormattedOnly;
      }

      if (files.length > 1) {
        return locale === "en" ? "Upload only 1 PDF at a time in this version." : "Envie apenas 1 PDF por vez nesta primeira versao.";
      }

      const [pdfFile] = files;
      if (pdfFile && pdfFile.size > maxPdfMb * 1024 * 1024) {
        return copy.maxPdf(maxPdfMb);
      }

      return null;
    }

    if (files.length > maxFiles) {
      return copy.maxImages(maxFiles);
    }

    if (totalBytes > maxBatchTotalMb * 1024 * 1024) {
      return copy.maxBatchTotal(maxBatchTotalMb);
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return copy.imageOnly;
      }

      if (file.size > maxImageMb * 1024 * 1024) {
        return copy.maxImage(maxImageMb);
      }
    }

    return null;
  }

  function getDocumentKind(file: File): DocumentKind {
    return file.type === "application/pdf" ? "pdf" : "image";
  }

  async function processFiles(files: SelectedFile[], selectedMode: Mode, options: { resetResults?: boolean } = {}) {
    const shouldResetResults = options.resetResults ?? true;
    setIsSubmitting(true);
    setGlobalError(null);
    setAnimatedPercent(0);
    setProgressTick(Date.now());
    if (shouldResetResults) {
      setEditedResults({});
      setResults(Object.fromEntries(files.map((file) => [file.id, { status: "idle" as const }])));
    } else {
      setEditedResults((current) => {
        const next = { ...current };
        files.forEach((file) => {
          delete next[file.id];
        });
        return next;
      });
      setResults((current) => ({
        ...current,
        ...Object.fromEntries(files.map((file) => [file.id, { status: "idle" as const }])),
      }));
    }

    try {
      for (const [index, item] of files.entries()) {
        const startedAt = Date.now();
        let succeeded = false;
        setProcessingState({ fileId: item.id, startedAt });
        setProgressTick(startedAt);
        setResults((current) => ({
          ...current,
          [item.id]: { status: "processing" },
        }));

        try {
          if (item.kind === "image") {
            const dataUrl = await fileToDataUrl(item.file);
            const response = await fetch(`${API_BASE_URL}/v1/ocr`, {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                mode: selectedMode,
                ocrLanguage,
                browserId: browserId.current,
                image: {
                  name: item.file.name,
                  mimeType: item.file.type,
                  size: item.file.size,
                  dataUrl,
                },
              }),
            });

            const payload = await parseJsonResponse<{
              error?: string;
              result?: ImageResultPayload;
            }>(response);
            const imageResult = payload.result;

            if (!response.ok || !imageResult) {
              throw new Error(payload.error || copy.imageProcessError);
            }

            setResults((current) => ({
              ...current,
              [item.id]: {
                status: "success",
                payload: {
                  kind: "image",
                  txt: imageResult.txt,
                  md: imageResult.md,
                  html: imageResult.html,
                  preview: imageResult.preview,
                },
              },
            }));
            succeeded = true;
          } else {
            if (selectedMode !== "formatted") {
              throw new Error(copy.pdfFormattedOnly);
            }

            const pageCount = item.pageCount ?? (await readPdfPageCount(item.file));
            const pdfSummary = buildPdfSelectionSummary({
              totalPages: pageCount,
              remainingCredits: limits?.usage.remainingCredits ?? 5,
              maxPagesPerDocument: limits?.limits.pdf.maxPagesPerDocument ?? 50,
            });
            const preparedPages = await buildPreparedPdfPages(item.file, pdfSummary.processablePages);
            const formData = new FormData();
            formData.set("file", item.file);
            formData.set("browserId", browserId.current);
            formData.set("totalPages", String(pageCount));
            formData.set("sourcePath", window.location.pathname);
            formData.set("preparedPages", JSON.stringify(preparedPages));
            formData.set("ocrLanguage", ocrLanguage);

            const response = await fetch(`${API_BASE_URL}/v1/pdf/ocr`, {
              method: "POST",
              credentials: "include",
              body: formData,
            });

            const payload = await parseJsonResponse<PdfResultPayload & { error?: string; code?: string; remainingPdfPagesToday?: number }>(response);
            if (!response.ok || !("kind" in payload) || payload.kind !== "pdf") {
              throw new Error(
                mapPdfOcrError({
                  code: payload.code ?? "unknown",
                  error: payload.error ?? "Falha ao processar o PDF.",
                  remainingPdfPagesToday: payload.remainingPdfPagesToday ?? 0,
                }),
              );
            }

            setResults((current) => ({
              ...current,
              [item.id]: {
                status: "success",
                payload,
              },
            }));
            succeeded = true;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : copy.unexpectedError;
          setResults((current) => ({
            ...current,
            [item.id]: {
              status: "error",
              message,
            },
          }));
        }

        setProcessingState(index < files.length - 1 ? null : { fileId: item.id, startedAt });
        await refreshLimits();
        if (succeeded) {
          announceUsageRefresh();
        }
      }
    } finally {
      setProcessingState(null);
      setProgressTick(Date.now());
      setIsSubmitting(false);
    }
  }

  async function handleFiles(nextFiles: File[]) {
    const mappedFiles = await Promise.all(
      nextFiles.map(async (file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        kind: getDocumentKind(file),
        pageCount: file.type === "application/pdf" ? await readPdfPageCount(file) : undefined,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      })),
    );
    const combinedFiles = [...selectedFilesRef.current, ...mappedFiles];
    const validationError = validateFiles(combinedFiles.map((entry) => entry.file), mode);
    if (validationError) {
      revokePreviewUrls(mappedFiles);
      setGlobalError(validationError);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFiles(combinedFiles);
    setResults((current) => ({
      ...current,
      ...Object.fromEntries(mappedFiles.map((file) => [file.id, { status: "idle" as const }])),
    }));
    setGlobalError(null);
    setAnimatedPercent(0);
    if (mode === "formatted") {
      setActiveFormat("html");
    } else {
      setActiveFormat("txt");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function resetFiles() {
    revokePreviewUrls(selectedFilesRef.current);
    selectedFilesRef.current = [];
    setSelectedFiles([]);
    setResults({});
    setEditedResults({});
    setGlobalError(null);
    setProcessingState(null);
    setAnimatedPercent(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(fileId: string) {
    if (isSubmitting) {
      return;
    }

    const removed = selectedFilesRef.current.find((file) => file.id === fileId);
    if (!removed) {
      return;
    }

    if (removed.previewUrl) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    const nextFiles = selectedFilesRef.current.filter((file) => file.id !== fileId);
    selectedFilesRef.current = nextFiles;
    setSelectedFiles(nextFiles);
    setResults((current) => {
      if (nextFiles.length === 0) {
        return {};
      }

      const next = { ...current };
      delete next[fileId];
      return next;
    });
    setEditedResults((current) => {
      const next = { ...current };
      delete next[fileId];
      return next;
    });
    setGlobalError(null);
    if (nextFiles.length === 0) {
      setAnimatedPercent(0);
    }
  }

  function getPayloadText(fileId: string, payload: ResultPayload, format: FormatTab) {
    const editedText = editedResults[fileId]?.[format];
    if (typeof editedText === "string") {
      return editedText;
    }

    if (format === "html") {
      return payload.html ?? payload.txt;
    }

    if (format === "md") {
      return payload.md ?? payload.txt;
    }

    return payload.txt;
  }

  function getPayloadForOutput(fileId: string, payload: ResultPayload): ResultPayload {
    const edits = editedResults[fileId] ?? {};

    if (payload.kind === "pdf") {
      return {
        ...payload,
        txt: edits.txt ?? payload.txt,
        md: edits.md ?? payload.md,
        html: edits.html ?? payload.html,
        previewHtml: edits.html ?? payload.previewHtml,
      };
    }

    const txt = edits.txt ?? payload.txt;
    return {
      ...payload,
      txt,
      md: edits.md ?? payload.md,
      html: edits.html ?? payload.html,
      preview: edits.txt ?? payload.preview,
    };
  }

  function updateEditedResult(fileId: string, format: FormatTab, value: string) {
    setEditedResults((current) => ({
      ...current,
      [fileId]: {
        ...current[fileId],
        [format]: value,
      },
    }));
  }

  function restoreOriginal(fileId: string) {
    setEditedResults((current) => {
      const next = { ...current };
      delete next[fileId];
      return next;
    });
  }

  function hasEditedResult(fileId: string) {
    return Object.keys(editedResults[fileId] ?? {}).length > 0;
  }

  async function retryFile(fileId: string) {
    if (isSubmitting) {
      return;
    }

    const file = selectedFilesRef.current.find((entry) => entry.id === fileId);
    if (file) {
      await processFiles([file], mode, { resetResults: false });
    }
  }

  function handleDownload(file: SelectedFile, payload: ResultPayload) {
    const name = baseName(file.file.name);
    const outputPayload = getPayloadForOutput(file.id, payload);
    if (outputPayload.kind === "pdf") {
      if (activeFormat === "txt") {
        downloadTextFile(`${name}.txt`, outputPayload.txt);
        return;
      }

      if (activeFormat === "md") {
        downloadTextFile(`${name}.md`, outputPayload.md, "text/markdown;charset=utf-8");
        return;
      }

      downloadHtmlFile(`${name}.html`, outputPayload.html);
      return;
    }

    if (mode === "simple" || activeFormat === "txt") {
      downloadTextFile(`${name}.txt`, outputPayload.txt);
      return;
    }

    if (activeFormat === "md" && outputPayload.md) {
      downloadTextFile(`${name}.md`, outputPayload.md, "text/markdown;charset=utf-8");
      return;
    }

    if (activeFormat === "html" && outputPayload.html) {
      downloadHtmlFile(`${name}.html`, outputPayload.html);
    }
  }

  async function handleBatchDownload() {
    if (completedItems.length === 0) {
      return;
    }

     if (completedItems.some(({ result }) => result.payload?.kind === "pdf")) {
      return;
    }

    await downloadBatchZip(
      `scanlume-${mode}-batch.zip`,
      completedItems.map(({ entry, result }) => ({
        baseName: baseName(entry.file.name),
        txt: getPayloadForOutput(entry.id, result.payload!).txt,
        md: getPayloadForOutput(entry.id, result.payload!).md,
        html: getPayloadForOutput(entry.id, result.payload!).html,
      })),
    );
  }

  const primaryPreview = completedItems[0]?.result.payload;
  const primaryFile = completedItems[0]?.entry;
  const isPdfPreview = primaryPreview?.kind === "pdf";
  const primaryPreviewText = primaryPreview && primaryFile ? getPayloadText(primaryFile.id, primaryPreview, activeFormat) : "";
  const primaryPreviewHtml = primaryPreview && primaryFile && activeFormat === "html" ? primaryPreviewText : "";
  const primaryResultEdited = primaryFile ? hasEditedResult(primaryFile.id) : false;
  const hasQueuedPdf = selectedFiles.some((file) => file.kind === "pdf");
  const hasQueuedFiles = selectedFiles.length > 0;
  const canStart = hasQueuedFiles && !isSubmitting && !(mode === "simple" && hasQueuedPdf);
  const modeActionLabel = mode === "simple" ? copy.startSimple : copy.startFormatted;
  const budgetUsed = limits?.budget.totalCostRmb ?? 0;
  const budgetLimit = limits?.limits.hardBudgetRmb ?? DISPLAY_DAILY_BUDGET_BRL;
  const budgetUsagePercent = clamp((budgetUsed / Math.max(budgetLimit, 1)) * 100, 0, 100);
  const budgetUsageLabel = `${brlFormatter.format(budgetUsed)} / ${brlFormatter.format(budgetLimit)}`;
  const maxImageMb = limits?.limits.maxImageMb ?? 5;
  const maxBatchTotalMb = limits?.limits.maxBatchTotalMb ?? 20;
  const maxBatchFiles = limits?.limits.maxBatchFiles ?? 10;
  const remainingCreditsLabel = `${limits?.usage.remainingCredits ?? 5} / ${limits?.limits.dailyCredits ?? 5}`;
  const uploadLimitLabel =
    copy.uploadLimit(mode, maxImageMb, maxBatchTotalMb, limits?.limits.pdf.maxFileMb ?? 15);
  const statusFootnote = limits?.viewer.authenticated
    ? copy.authenticatedFootnote
    : copy.anonymousFootnote;

  return (
    <section className={`workspace-shell ocr-desk-shell ocr-tool-first-shell${priorityLayout ? " workspace-shell-priority" : ""}`}>
      {limits && (
        <div className="upload-credit-pill-new">
          {copy.creditsLabel}: {limits.usage.remainingCredits} / {limits.limits.dailyCredits}
        </div>
      )}
      {!priorityLayout && (
        <div className="workspace-head">
          <div>
            <p className="eyebrow">{copy.toolEyebrow}</p>
            <h2>{copy.toolTitle}</h2>
            <p className="workspace-intro">
              {copy.toolIntro}
            </p>
          </div>
        </div>
      )}

      <div className="workspace-grid workspace-desk-grid ocr-desk-command-bar">
        <div className="upload-panel card-surface" role="region" aria-label={copy.inputAria}>
          <div className="upload-panel-head">
            <div>
              <p className="eyebrow">{copy.inputEyebrow}</p>
              <div className="upload-panel-title-row">
                <h3>{priorityLayout ? copy.uploadTitlePriority : copy.uploadTitle}</h3>
              </div>
              <p className="upload-panel-summary">
                {priorityLayout ? copy.uploadSummaryPriority : copy.uploadSummary}
              </p>
            </div>
          </div>

          <div className="dropzone-dashed-wrap">
            <div className="ocr-options-row">
              <div className="mode-toggle" role="tablist" aria-label={copy.modeAria}>
                <button
                  className={mode === "simple" ? "is-active" : ""}
                  onClick={() => {
                    setMode("simple");
                    if (hasQueuedPdf) {
                      setGlobalError(copy.pdfFormattedOnly);
                    }
                  }}
                  type="button"
                >
                  {locale === "en" ? "Simple OCR" : SIMPLE_MODE_LABEL}
                </button>
                <button
                  className={mode === "formatted" ? "is-active" : ""}
                  onClick={() => setMode("formatted")}
                  type="button"
                >
                  {locale === "en" ? "Formatted Text" : FORMATTED_MODE_LABEL}
                </button>
              </div>

              <label className="ocr-language-control">
                <span>{copy.languageLabel}</span>
                <select
                  aria-label={copy.languageAria}
                  value={ocrLanguage}
                  onChange={(event) => setOcrLanguage(event.target.value as OcrLanguage)}
                >
                  {(Object.keys(copy.languageOptions) as OcrLanguage[]).map((language) => (
                    <option key={language} value={language}>
                      {copy.languageOptions[language]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="upload-dropzone" htmlFor="scanlume-upload">
              <input
                id="scanlume-upload"
                ref={fileInputRef}
                type="file"
                accept={mode === "formatted" ? "image/*,application/pdf" : "image/*"}
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.length > 0) {
                    void handleFiles(files);
                  }
                }}
              />
              <div className="upload-dropzone-inner">
                {/* SVG Upload Icon */}
                <svg className="upload-icon-svg" viewBox="0 0 24 24" fill="none" stroke="#0b5334" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 12 15 15" />
                </svg>
                
                <strong>{mode === "formatted" ? copy.dropFormatted : copy.dropSimple}</strong>
                <span className="upload-subtext">{uploadLimitLabel} {copy.maxFilesSuffix(maxBatchFiles)}</span>
                
                <div className="divider-ou">
                  <span className="divider-line"></span>
                  <span className="divider-text">{copy.or}</span>
                  <span className="divider-line"></span>
                </div>
                
                <button
                  className="select-file-btn"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" className="btn-icon">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  {copy.selectFile}
                </button>
              </div>
            </label>
          </div>

          <button
            className="solid-button start-ocr-btn"
            type="button"
            disabled={!canStart}
            onClick={() => void processFiles(selectedFiles, mode)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" className="magic-wand-icon">
              <path d="m15 4-2-2-2 2-2-2-2 2-2-2-2 2" />
              <path d="M19 11v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
              <path d="M21 7v4" />
              <path d="M17 9h4" />
              <path d="m11 11 9-9" />
            </svg>
            {isSubmitting ? copy.processing : modeActionLabel}
          </button>
          {isSubmitting && (
            <p className="ocr-processing-hint" role="status">
              {copy.processingHint}
            </p>
          )}

          {globalError && <p className="error-banner">{globalError}</p>}
        </div>

        {/* Region: Leitura OCR ao vivo. Styled as the bottom file list */}
        <div className="scan-panel card-surface" role="region" aria-label={locale === "en" ? "Live OCR queue" : "Leitura OCR ao vivo"}>
          <div className="scan-panel-head">
            <div>
              <h3>{copy.queueTitle}</h3>
            </div>
          </div>

          <div className="preview-stack">
            {selectedFiles.length === 0 ? (
              <div className="empty-state queue-empty-state">
                <p>{copy.queueEmpty}</p>
              </div>
            ) : (
              <div className="selected-file-table-wrapper">
                <table className="selected-file-table">
                  <thead>
                    <tr>
                      <th>{copy.fileColumn}</th>
                      <th>{copy.pagesColumn}</th>
                      <th>{copy.modeColumn}</th>
                      <th>{copy.statusColumn}</th>
                      <th>{copy.progressColumn}</th>
                      <th>{copy.actionsColumn}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFiles.map((item) => {
                      const result = results[item.id];
                      const pageCount = item.pageCount ?? 1;
                      
                      let progressPercent = 0;
                      if (result?.status === "success") progressPercent = 100;
                      else if (result?.status === "processing") progressPercent = animatedPercent;
                      
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="file-info-cell">
                              <svg className="file-icon-svg" viewBox="0 0 24 24" fill="none" stroke="#0b5334" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <div className="file-name-meta">
                                <strong className="file-name">{item.file.name}</strong>
                                <span className="file-size">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                              </div>
                            </div>
                          </td>
                          <td className="pages-col">{pageCount}</td>
                          <td>
                            <span className="mode-badge">
                              {mode === "simple" ? copy.modeBadgeSimple : copy.modeBadgeFormatted}
                            </span>
                          </td>
                          <td>
                            <div className="status-cell-stack">
                              <span className={`status-badge status-${result?.status ?? "idle"}`}>
                                {copy.status[result?.status ?? "idle"]}
                              </span>
                              {result?.status === "error" && result.message ? (
                                <small>{result.message}</small>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <div className="progress-cell">
                              <div className="progress-bar-track">
                                <div
                                  className="progress-bar-fill"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <span className="progress-text">
                                {result?.status === "success" ? `${pageCount}/${pageCount}` :
                                 result?.status === "processing" ? `${Math.round(animatedPercent)}%` : `0/${pageCount}`}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="actions-cell">
                              {result?.status === "error" && (
                                <button
                                  type="button"
                                  aria-label={copy.retry}
                                  title={copy.retry}
                                  disabled={isSubmitting}
                                  onClick={() => void retryFile(item.id)}
                                  className="retry-row-btn"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                    <polyline points="1 4 1 10 7 10" />
                                    <path d="M3.5 15a9 9 0 1 0 2-9.5L1 10" />
                                  </svg>
                                </button>
                              )}
                              {result?.status === "success" && result.payload && (
                                <button
                                  type="button"
                                  aria-label={copy.downloadResult}
                                  onClick={() => handleDownload(item, result.payload!)}
                                  className="download-row-btn"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                  </svg>
                                </button>
                              )}
                              <button
                                type="button"
                                aria-label={copy.removeFile(item.file.name)}
                                disabled={isSubmitting}
                                onClick={() => removeFile(item.id)}
                                className="delete-row-btn"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Region: Preview do resultado */}
        <div className="result-panel card-surface" role="region" aria-label={locale === "en" ? "Result preview" : "Preview do resultado"}>
          <div className="result-head">
            <div>
              <h3>{copy.resultTitle}</h3>
            </div>
            
            <div className="result-head-right">
              <div className="format-tabs">
                <button
                  className={activeFormat === "txt" ? "is-active" : ""}
                  onClick={() => setActiveFormat("txt")}
                  type="button"
                >
                  TXT
                </button>
                <button
                  className={activeFormat === "md" ? "is-active" : ""}
                  onClick={() => setActiveFormat("md")}
                  type="button"
                  disabled={!isPdfPreview && mode === "simple"}
                >
                  MD
                </button>
                <button
                  className={activeFormat === "html" ? "is-active" : ""}
                  onClick={() => setActiveFormat("html")}
                  type="button"
                  disabled={!isPdfPreview && mode === "simple"}
                >
                  HTML
                </button>
              </div>
              
              <button
                className="result-clear-btn"
                type="button"
                onClick={resetFiles}
                disabled={selectedFiles.length === 0}
                aria-label={copy.clearResults}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                {copy.clear}
              </button>
            </div>
          </div>

          {!primaryPreview && (
            <div className="empty-state preview-placeholder">
              <p>{copy.previewEmpty}</p>
            </div>
          )}

          {primaryPreview && (
            <>
              {isPdfPreview && primaryFile && (
                <div className="pdf-result-summary">
                  <strong>{primaryFile.file.name}</strong>
                  <span>{copy.pdfTotal(primaryPreview.totalPages)}</span>
                  <span>{copy.pdfProcessed(primaryPreview.processedPages)}</span>
                  <span>{copy.pdfNativeText(primaryPreview.pageStats.textLayerPages)}</span>
                  <span>{copy.pdfOcr(primaryPreview.pageStats.ocrPages)}</span>
                  <span>{copy.pdfMixed(primaryPreview.pageStats.mixedPages)}</span>
                  {primaryPreview.billingUpsell?.required ? <a href={primaryPreview.billingUpsell.ctaHref}>{primaryPreview.billingUpsell.ctaLabel}</a> : null}
                </div>
              )}

              <div className="result-preview">
                {activeFormat === "html" && primaryPreviewHtml ? (
                  <div
                    className="html-preview"
                    data-testid={isPdfPreview ? "pdf-preview-html" : undefined}
                    dangerouslySetInnerHTML={{ __html: primaryPreviewHtml }}
                  />
                ) : null}
                {primaryFile && (
                  <label className="result-editor-block">
                    <span>{copy.editorLabel(activeFormat)}</span>
                    <textarea
                      className="result-editor-textarea"
                      value={primaryPreviewText}
                      onChange={(event) => updateEditedResult(primaryFile.id, activeFormat, event.target.value)}
                    />
                  </label>
                )}
              </div>

              <div className="preview-actions">
                <button
                  className="ghost-button copy-result-btn"
                  type="button"
                  onClick={() => navigator.clipboard.writeText(primaryPreviewText)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" className="btn-icon">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {copy.copyText}
                </button>
                {primaryFile && (
                  <button
                    className="ghost-button restore-result-btn"
                    type="button"
                    disabled={!primaryResultEdited}
                    onClick={() => restoreOriginal(primaryFile.id)}
                  >
                    {copy.restoreOriginal}
                  </button>
                )}
                {primaryFile && (
                  <button
                    className="solid-button download-result-btn"
                    type="button"
                    onClick={() => handleDownload(primaryFile, primaryPreview)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" className="btn-icon">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {copy.downloadAs}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" className="chevron-down-icon">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                )}
                {isPdfPreview && primaryFile && (
                  <>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => void requestPdfExport(`${API_BASE_URL}/v1/pdf/export/searchable`, {
                        file: primaryFile.file,
                        exportToken: primaryPreview.exportToken,
                        exportManifest: primaryPreview.exportManifest,
                        filename: `${baseName(primaryFile.file.name)}-searchable.pdf`,
                      })}
                    >
                      {copy.searchablePdf}
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => void requestPdfExport(`${API_BASE_URL}/v1/pdf/export/reflowed`, {
                        file: primaryFile.file,
                        exportToken: primaryPreview.exportToken,
                        exportManifest: primaryPreview.exportManifest,
                        filename: `${baseName(primaryFile.file.name)}-reflowed.pdf`,
                      })}
                    >
                      {copy.reflowedPdf}
                    </button>
                  </>
                )}
                {completedItems.length > 1 && (
                  <button className="ghost-button" type="button" onClick={() => void handleBatchDownload()}>
                    {copy.batchZip}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {limits && (
          <div className="workspace-status-wide">
            {!limits.viewer.authenticated && (
              <div className="login-promo sr-only">
                <div className="login-promo-copy">
                  <strong>Entre para transformar o teste em conta gratuita</strong>
                  <small>Usuarios conectados recebem 50 credits totais e acompanham o saldo direto na conta.</small>
                </div>
                <button type="button" className="solid-button" onClick={() => setIsAuthDialogOpen(true)}>
                  Entrar agora
                </button>
              </div>
            )}

            <div className="status-board sr-only">
              <div className="budget-status-card status-compact-card">
                <span>Hoje / limite</span>
                <strong>{budgetUsageLabel}</strong>
                <div className="mini-progress-track" aria-hidden="true">
                  <div className="mini-progress-fill" style={{ width: `${budgetUsagePercent}%` }} />
                </div>
              </div>
              <div className="status-compact-card">
                <span>Plano</span>
                <strong>{limits.plan.shortLabel}</strong>
                <small>{limits.plan.label}</small>
              </div>
              <div className="status-compact-card">
                <span>{limits.viewer.authenticated ? "Creditos" : "Creditos anonimos"}</span>
                <strong>{remainingCreditsLabel}</strong>
              </div>
              <div className="status-compact-card status-help-card">
                <span>Custos</span>
                <div
                  className="workspace-help-shell"
                  onMouseEnter={() => setIsPricingHintOpen(true)}
                  onMouseLeave={() => setIsPricingHintOpen(false)}
                >
                  <button
                    type="button"
                    className="workspace-help-button workspace-help-text-button"
                    aria-label="Entender limites do teste gratis"
                    aria-expanded={isPricingHintOpen}
                    onClick={() => setIsPricingHintOpen((current) => !current)}
                  >
                    Ver regras
                  </button>
                  {isPricingHintOpen && (
                    <div className="workspace-help-popover is-open" role="tooltip">
                      <strong>Como calculamos o teste gratis</strong>
                      <span>Saldo atual: {remainingCreditsLabel} credits.</span>
                      <span>{SIMPLE_MODE_LABEL} consome 1 credito por imagem.</span>
                      <span>{FORMATTED_MODE_LABEL} consome 2 credits por imagem.</span>
                      <span>PDF consome 2 credits por pagina processada.</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="status-board-note">{statusFootnote}</p>
            </div>
          </div>
        )}
      </div>
      <AuthDialog open={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} defaultMode="register" />
    </section>
  );
}
