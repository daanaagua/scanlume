"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AuthDialog } from "@/components/auth-dialog";
import { getOrCreateBrowserId } from "@/lib/browser-id";
import { downloadBatchZip, downloadHtmlFile, downloadTextFile } from "@/lib/downloads";
import { API_BASE_URL, FORMATTED_MODE_LABEL, SIMPLE_MODE_LABEL } from "@/lib/site";

type Mode = "simple" | "formatted";
type FormatTab = "txt" | "md" | "html";

type SelectedFile = {
  id: string;
  file: File;
  previewUrl: string;
};

type ResultPayload = {
  txt: string;
  md?: string;
  html?: string;
  preview: string;
};

type FileResult = {
  status: "idle" | "processing" | "success" | "error";
  message?: string;
  payload?: ResultPayload;
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
  files.forEach((file) => URL.revokeObjectURL(file.previewUrl));
}

type OcrWorkspaceProps = {
  defaultMode?: Mode;
  priorityLayout?: boolean;
};

export function OcrWorkspace({ defaultMode = "simple", priorityLayout = false }: OcrWorkspaceProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [activeFormat, setActiveFormat] = useState<FormatTab>("txt");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [results, setResults] = useState<Record<string, FileResult>>({});
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
        label: `${completedCount} de ${totalCount} imagem(ns) concluida(s).`,
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
        label: `Reconhecendo imagem ${processingIndex + 1} de ${totalCount}...`,
      };
    }

    return {
      activeFileNumber: 0,
      completedCount,
      totalCount,
      percent: completedCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      label: `${totalCount} imagem(ns) pronta(s). Clique em iniciar para processar.`,
    };
  }, [isSubmitting, processingState, progressTick, results, selectedFiles]);

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

  function validateFiles(files: File[]) {
    const maxFiles = limits?.limits.maxBatchFiles ?? 10;
    const maxImageMb = limits?.limits.maxImageMb ?? 5;
    const maxBatchTotalMb = limits?.limits.maxBatchTotalMb ?? 20;
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

    if (files.length > maxFiles) {
      return `Selecione no maximo ${maxFiles} imagens por lote.`;
    }

    if (totalBytes > maxBatchTotalMb * 1024 * 1024) {
      return `O lote total deve ficar abaixo de ${maxBatchTotalMb} MB.`;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return "Envie apenas imagens JPG, PNG, WEBP ou formatos equivalentes.";
      }

      if (file.size > maxImageMb * 1024 * 1024) {
        return `Cada imagem precisa ter no maximo ${maxImageMb} MB.`;
      }
    }

    return null;
  }

  async function processFiles(files: SelectedFile[], selectedMode: Mode) {
    setIsSubmitting(true);
    setGlobalError(null);
    setAnimatedPercent(0);
    setProgressTick(Date.now());
    setResults(Object.fromEntries(files.map((file) => [file.id, { status: "idle" as const }])));

    try {
      for (const [index, item] of files.entries()) {
        const startedAt = Date.now();
        setProcessingState({ fileId: item.id, startedAt });
        setProgressTick(startedAt);
        setResults((current) => ({
          ...current,
          [item.id]: { status: "processing" },
        }));

        try {
          const dataUrl = await fileToDataUrl(item.file);
          const response = await fetch(`${API_BASE_URL}/v1/ocr`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mode: selectedMode,
              browserId: browserId.current,
              image: {
                name: item.file.name,
                mimeType: item.file.type,
                size: item.file.size,
                dataUrl,
              },
            }),
          });

          const payload = (await response.json()) as {
            error?: string;
            result?: ResultPayload;
          };

          if (!response.ok || !payload.result) {
            throw new Error(payload.error || "Falha ao processar a imagem.");
          }

          setResults((current) => ({
            ...current,
            [item.id]: {
              status: "success",
              payload: payload.result,
            },
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erro inesperado.";
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
      }
    } finally {
      setProcessingState(null);
      setProgressTick(Date.now());
      setIsSubmitting(false);
    }
  }

  function handleFiles(nextFiles: File[]) {
    const mappedFiles = nextFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    const combinedFiles = [...selectedFilesRef.current, ...mappedFiles];
    const validationError = validateFiles(combinedFiles.map((entry) => entry.file));
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

    URL.revokeObjectURL(removed.previewUrl);
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
    setGlobalError(null);
    if (nextFiles.length === 0) {
      setAnimatedPercent(0);
    }
  }

  function handleDownload(file: SelectedFile, payload: ResultPayload) {
    const name = baseName(file.file.name);
    if (mode === "simple" || activeFormat === "txt") {
      downloadTextFile(`${name}.txt`, payload.txt);
      return;
    }

    if (activeFormat === "md" && payload.md) {
      downloadTextFile(`${name}.md`, payload.md, "text/markdown;charset=utf-8");
      return;
    }

    if (activeFormat === "html" && payload.html) {
      downloadHtmlFile(`${name}.html`, payload.html);
    }
  }

  async function handleBatchDownload() {
    if (completedItems.length === 0) {
      return;
    }

    await downloadBatchZip(
      `scanlume-${mode}-batch.zip`,
      completedItems.map(({ entry, result }) => ({
        baseName: baseName(entry.file.name),
        txt: result.payload!.txt,
        md: result.payload!.md,
        html: result.payload!.html,
      })),
    );
  }

  const primaryPreview = completedItems[0]?.result.payload;
  const primaryFile = completedItems[0]?.entry;
  const hasQueuedFiles = selectedFiles.length > 0;
  const hasCompletedResults = completedItems.length > 0;
  const canStart = hasQueuedFiles && !isSubmitting;
  const modeActionLabel = mode === "simple" ? `Iniciar ${SIMPLE_MODE_LABEL}` : `Iniciar ${FORMATTED_MODE_LABEL}`;
  const budgetUsed = limits?.budget.totalCostRmb ?? 0;
  const budgetLimit = limits?.limits.hardBudgetRmb ?? DISPLAY_DAILY_BUDGET_BRL;
  const budgetUsagePercent = clamp((budgetUsed / Math.max(budgetLimit, 1)) * 100, 0, 100);
  const budgetUsageLabel = `${brlFormatter.format(budgetUsed)} / ${brlFormatter.format(budgetLimit)}`;
  const maxImageMb = limits?.limits.maxImageMb ?? 5;
  const maxBatchTotalMb = limits?.limits.maxBatchTotalMb ?? 20;
  const maxBatchFiles = limits?.limits.maxBatchFiles ?? 10;
  const remainingCreditsLabel = limits?.viewer.authenticated
    ? `${limits.usage.remainingCredits} / ${limits.limits.dailyCredits}`
    : `${limits?.limits.dailyImages ?? maxBatchFiles} imagens`;
  const remainingImagesLabel = limits?.viewer.authenticated
    ? `${limits.usage.remainingImages} / ${limits.limits.dailyImages}`
    : `${maxBatchFiles} imagens`;
  const statusFootnote = limits?.viewer.authenticated
    ? `OCR simples = 1 credito • Texto formatado = 3 creditos • Atualizado apos cada OCR.`
    : `OCR simples = 1 credito • Texto formatado = 3 creditos • Lote atual aceita ate ${maxBatchFiles} imagens.`;

  return (
    <section className={`workspace-shell${priorityLayout ? " workspace-shell-priority" : ""}`}>
      {!priorityLayout && (
        <div className="workspace-head">
          <div>
            <p className="eyebrow">Ferramenta principal</p>
            <h2>Upload instantaneo com previa e download.</h2>
            <p className="workspace-intro">
              {SIMPLE_MODE_LABEL} entrega texto puro. {FORMATTED_MODE_LABEL} reorganiza titulos, paragrafos e a estrutura principal para Word, Markdown e HTML.
            </p>
          </div>
        </div>
      )}

      <div className="workspace-grid">
        <div className="upload-panel card-surface">
          <div className="upload-panel-head">
            <div>
              <p className="eyebrow">Comece pelo upload</p>
              <div className="upload-panel-title-row">
                <h3>{priorityLayout ? "Envie uma imagem e teste agora." : "Envie a imagem certa para comecar."}</h3>
                <div
                  className="workspace-help-shell"
                  onMouseEnter={() => setIsPricingHintOpen(true)}
                  onMouseLeave={() => setIsPricingHintOpen(false)}
                >
                  <button
                    type="button"
                    className="workspace-help-button"
                    aria-label="Entender limites do teste gratis"
                    aria-expanded={isPricingHintOpen}
                    onClick={() => setIsPricingHintOpen((current) => !current)}
                    onFocus={() => setIsPricingHintOpen(true)}
                    onBlur={() => setIsPricingHintOpen(false)}
                  >
                    ?
                  </button>
                  <div className={`workspace-help-popover${isPricingHintOpen ? " is-open" : ""}`} role="tooltip">
                    <strong>Como calculamos o teste gratis</strong>
                    <span>Limite diario: {brlFormatter.format(budgetLimit)}.</span>
                    <span>{SIMPLE_MODE_LABEL} consome 1 credito por imagem.</span>
                    <span>{FORMATTED_MODE_LABEL} consome 3 creditos por imagem.</span>
                  </div>
                </div>
              </div>
              <p>
                Abra JPG, PNG e screenshots no navegador e escolha a saida que faz sentido para copiar, revisar ou baixar.
              </p>
            </div>
          </div>

          <div className="mode-toggle" role="tablist" aria-label="Modo OCR">
            <button
              className={mode === "simple" ? "is-active" : ""}
              onClick={() => setMode("simple")}
              type="button"
            >
              {SIMPLE_MODE_LABEL}
            </button>
            <button
              className={mode === "formatted" ? "is-active" : ""}
              onClick={() => setMode("formatted")}
              type="button"
            >
              {FORMATTED_MODE_LABEL}
            </button>
          </div>

          <label className="upload-dropzone" htmlFor="scanlume-upload">
            <input
              id="scanlume-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length > 0) {
                  handleFiles(files);
                }
              }}
            />
            <strong>Arraste imagens aqui ou clique para enviar</strong>
            <span>O upload aparece na fila na hora e voce escolhe quando iniciar o OCR.</span>
            <small>
              Ate {maxImageMb} MB por imagem, {maxBatchTotalMb} MB por lote e {maxBatchFiles} arquivo(s) por envio.
            </small>
          </label>

          <div className="upload-actions">
            <button
              className="ghost-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              Selecionar imagens
            </button>
            <button className="ghost-button" type="button" onClick={resetFiles}>
              Limpar
            </button>
            <button
              className="solid-button"
              type="button"
              disabled={!canStart}
              onClick={() => void processFiles(selectedFiles, mode)}
            >
              {isSubmitting ? "Reconhecendo..." : modeActionLabel}
            </button>
          </div>

          {hasQueuedFiles && (
            <div className="queue-summary">
              <strong>{selectedFiles.length} arquivo(s) pronto(s) para reconhecimento</strong>
              <span>
                {hasCompletedResults
                  ? "Voce pode trocar o modo e clicar novamente para gerar outra saida."
                  : "Os arquivos ficam na fila ate voce clicar em iniciar."}
                </span>
            </div>
          )}

          {progressSummary && (
            <div className="progress-card" aria-live="polite">
              <div className="progress-meta">
                <strong>{progressSummary.label}</strong>
                <span>{Math.round(animatedPercent)}%</span>
              </div>
              <div className="progress-track" aria-hidden="true">
                <div
                  className={`progress-fill${isSubmitting ? " is-processing" : ""}`}
                  style={{ width: `${animatedPercent}%` }}
                />
              </div>
              <small>
                {isSubmitting
                  ? "O indicador sobe de forma gradual durante o OCR e fecha imediatamente quando o arquivo termina."
                  : "O progresso total aparece aqui durante o OCR e ajuda a acompanhar lotes maiores."}
              </small>
            </div>
          )}

          {globalError && <p className="error-banner">{globalError}</p>}

          {limits && !limits.viewer.authenticated && (
            <div className="login-promo">
              <div className="login-promo-copy">
                <strong>Entre com email ou Google para transformar seu teste em uma conta gratuita</strong>
                <small>Usuarios conectados recebem uma cota diaria maior e um espaco de conta proprio.</small>
              </div>
              <button type="button" className="solid-button" onClick={() => setIsAuthDialogOpen(true)}>
                Entrar agora
              </button>
            </div>
          )}

          {limits && (
            <div className="status-board">
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
                <span>{limits.viewer.authenticated ? "Creditos" : "Cota anonima"}</span>
                <strong>{remainingCreditsLabel}</strong>
              </div>
              <div className="status-compact-card">
                <span>{limits.viewer.authenticated ? "Imagens" : "Lote maximo"}</span>
                <strong>{remainingImagesLabel}</strong>
              </div>
              <p className="status-board-note">{statusFootnote}</p>
            </div>
          )}

          <p className="workspace-note">
            Teste gratis no navegador. Os detalhes de custo ficam no bloco de status e no botao de ajuda ao lado do titulo.
          </p>

          <div className="preview-stack">
            {selectedFiles.length === 0 && (
              <div className="empty-state">
                <p>Suba uma screenshot, poster ou foto para ver o OCR rodando em pt-BR.</p>
              </div>
            )}

            <div className="selected-file-grid">
              {selectedFiles.map((item) => {
                const result = results[item.id];
                return (
                  <article key={item.id} className="mini-file-card">
                    <button
                      className="mini-file-remove"
                      type="button"
                      aria-label={`Remover ${item.file.name}`}
                      disabled={isSubmitting}
                      onClick={() => removeFile(item.id)}
                    >
                      x
                    </button>
                    {/* Local object URLs are not compatible with Next image optimization. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.previewUrl} alt={item.file.name} width={92} height={92} />
                    <div className="mini-file-meta">
                      <strong>{item.file.name}</strong>
                      <span>{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <p>
                        {result?.status === "processing" && "Processando..."}
                        {result?.status === "success" && "Pronto para copiar e baixar."}
                        {result?.status === "error" && result.message}
                        {(result?.status === "idle" || !result) && "Aguardando clique em iniciar."}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <div className="result-panel card-surface">
          <div className="result-head">
            <div>
              <p className="eyebrow">Preview do resultado</p>
              <h3>{primaryFile ? primaryFile.file.name : "Resultado aparece aqui"}</h3>
            </div>
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
                disabled={mode === "simple"}
              >
                MD
              </button>
              <button
                className={activeFormat === "html" ? "is-active" : ""}
                onClick={() => setActiveFormat("html")}
                type="button"
                disabled={mode === "simple"}
              >
                HTML
              </button>
            </div>
          </div>

          {!primaryPreview && (
            <div className="empty-state preview-placeholder">
              <p>Selecione uma imagem para testar `imagem para texto` agora mesmo.</p>
            </div>
          )}

          {primaryPreview && (
            <>
              <div className="preview-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => navigator.clipboard.writeText(
                    activeFormat === "html"
                      ? primaryPreview.html ?? ""
                      : activeFormat === "md"
                        ? primaryPreview.md ?? primaryPreview.txt
                        : primaryPreview.txt,
                  )}
                >
                  Copiar resultado
                </button>
                {primaryFile && (
                  <button
                    className="solid-button"
                    type="button"
                    onClick={() => handleDownload(primaryFile, primaryPreview)}
                  >
                    Baixar arquivo
                  </button>
                )}
                {completedItems.length > 1 && (
                  <button className="ghost-button" type="button" onClick={() => void handleBatchDownload()}>
                    Baixar lote ZIP
                  </button>
                )}
              </div>

              <div className="result-preview">
                {activeFormat === "html" && primaryPreview.html ? (
                  <div
                    className="html-preview"
                    dangerouslySetInnerHTML={{ __html: primaryPreview.html }}
                  />
                ) : (
                  <pre>
                    {activeFormat === "md"
                      ? primaryPreview.md ?? primaryPreview.txt
                      : primaryPreview.txt}
                  </pre>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <AuthDialog open={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} defaultMode="register" />
    </section>
  );
}
