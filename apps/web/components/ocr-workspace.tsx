"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { getOrCreateBrowserId } from "@/lib/browser-id";
import { downloadBatchZip, downloadHtmlFile, downloadTextFile } from "@/lib/downloads";
import { API_BASE_URL } from "@/lib/site";

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

type LimitsResponse = {
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
  status: {
    softStopped: boolean;
    hardStopped: boolean;
  };
};

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

export function OcrWorkspace({ defaultMode = "simple" }: { defaultMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [activeFormat, setActiveFormat] = useState<FormatTab>("txt");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [results, setResults] = useState<Record<string, FileResult>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [limits, setLimits] = useState<LimitsResponse | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const browserId = useRef("browser-id-pending");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    browserId.current = getOrCreateBrowserId();
    void fetch(`${API_BASE_URL}/v1/limits`)
      .then((response) => response.json())
      .then((data: LimitsResponse) => setLimits(data))
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (mode === "simple" && activeFormat !== "txt") {
      setActiveFormat("txt");
    }
  }, [mode, activeFormat]);

  useEffect(
    () => () => {
      selectedFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl));
    },
    [selectedFiles],
  );

  const completedItems = useMemo(
    () =>
      selectedFiles
        .map((entry) => ({ entry, result: results[entry.id] }))
        .filter((entry) => entry.result?.status === "success" && entry.result.payload),
    [results, selectedFiles],
  );

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
    setGlobalError(null);
    setResults(
      Object.fromEntries(files.map((file) => [file.id, { status: "processing" as const }])),
    );

    for (const item of files) {
      try {
        const dataUrl = await fileToDataUrl(item.file);
        const response = await fetch(`${API_BASE_URL}/v1/ocr`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: selectedMode,
            browserId: browserId.current,
            turnstileToken: turnstileToken || undefined,
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
    }

    void fetch(`${API_BASE_URL}/v1/limits`)
      .then((response) => response.json())
      .then((data: LimitsResponse) => setLimits(data))
      .catch(() => null);
  }

  async function handleFiles(nextFiles: File[]) {
    const validationError = validateFiles(nextFiles);
    if (validationError) {
      setGlobalError(validationError);
      return;
    }

    const mappedFiles = nextFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedFiles(mappedFiles);
    await processFiles(mappedFiles, mode);
  }

  function resetFiles() {
    selectedFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl));
    setSelectedFiles([]);
    setResults({});
    setGlobalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

  return (
    <section className="workspace-shell">
      <div className="workspace-head">
        <div>
          <p className="eyebrow">Ferramenta principal</p>
          <h2>Upload instantaneo com preview e download.</h2>
          <p>
            Simple OCR entrega texto puro. Formatted Text reorganiza titulos, paragrafos e a estrutura principal para Word, Markdown e HTML.
          </p>
        </div>

        <div className="limit-pills">
          <span>Anonimo: 5 imagens por dia</span>
          <span>Simple = 1 credito</span>
          <span>Formatted = 3 creditos</span>
        </div>
      </div>

      <div className="mode-toggle" role="tablist" aria-label="Modo OCR">
        <button
          className={mode === "simple" ? "is-active" : ""}
          onClick={() => setMode("simple")}
          type="button"
        >
          Simple OCR
        </button>
        <button
          className={mode === "formatted" ? "is-active" : ""}
          onClick={() => setMode("formatted")}
          type="button"
        >
          Formatted Text
        </button>
      </div>

      <div className="workspace-grid">
        <div className="upload-panel card-surface">
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
                  void handleFiles(files);
                }
              }}
            />
            <strong>Arraste imagens aqui ou clique para enviar</strong>
            <span>1 imagem imediata ou ate 10 arquivos por lote</span>
            <small>Maximo de 5 MB por imagem e 20 MB por lote</small>
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
            {selectedFiles.length > 0 && (
              <button
                className="solid-button"
                type="button"
                onClick={() => void processFiles(selectedFiles, mode)}
              >
                Processar novamente
              </button>
            )}
          </div>

          <div className="turnstile-note">
            <strong>Turnstile:</strong>
            <span>
              O componente visual pode ser conectado depois com `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. O worker ja aceita o token quando a chave secreta estiver configurada.
            </span>
            <input
              className="token-input"
              value={turnstileToken}
              onChange={(event) => setTurnstileToken(event.target.value)}
              placeholder="Cole o token Turnstile aqui em ambiente de teste, se necessario"
            />
          </div>

          {limits && (
            <div className="status-board">
              <div>
                <span>Orcamento hoje</span>
                <strong>R$ {limits.budget.totalCostRmb.toFixed(4)}</strong>
              </div>
              <div>
                <span>Soft stop</span>
                <strong>R$ {limits.limits.softBudgetRmb}</strong>
              </div>
              <div>
                <span>Hard stop</span>
                <strong>R$ {limits.limits.hardBudgetRmb}</strong>
              </div>
            </div>
          )}

          {globalError && <p className="error-banner">{globalError}</p>}

          <div className="preview-stack">
            {selectedFiles.length === 0 && (
              <div className="empty-state">
                <p>Suba uma screenshot, poster ou foto para ver o OCR rodando em pt-BR.</p>
              </div>
            )}

            {selectedFiles.map((item) => {
              const result = results[item.id];
              return (
                <article key={item.id} className="mini-file-card">
                  <Image
                    src={item.previewUrl}
                    alt={item.file.name}
                    width={92}
                    height={92}
                    unoptimized
                  />
                  <div>
                    <strong>{item.file.name}</strong>
                    <span>{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <p>
                      {result?.status === "processing" && "Processando..."}
                      {result?.status === "success" && "Pronto para copiar e baixar."}
                      {result?.status === "error" && result.message}
                      {!result && "Na fila."}
                    </p>
                  </div>
                </article>
              );
            })}
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
    </section>
  );
}
