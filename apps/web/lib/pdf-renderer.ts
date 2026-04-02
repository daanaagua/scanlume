type NativeTextBlock = {
  text: string;
  bbox: { x: number; y: number; width: number; height: number };
};

type PreparedPdfPage = {
  pageNumber: number;
  source: "text-layer" | "ocr";
  pagePngBase64?: string;
  nativeTextBlocks: NativeTextBlock[];
  ocrRegions: Array<{ id: string; imageBase64: string; bbox: { x: number; y: number; width: number; height: number } }>;
};

declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (input: { data: Uint8Array }) => {
        promise: Promise<{
          numPages: number;
          getPage: (pageNumber: number) => Promise<{
            getViewport: (input: { scale: number }) => { width: number; height: number };
            render: (input: { canvas: HTMLCanvasElement; canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> };
            getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
          }>;
        }>;
      };
    };
  }
}

const PDF_JS_SCRIPT_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDF_JS_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[data-pdfjs-src=\"${src}\"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as HTMLScriptElement).dataset.loaded === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Nao foi possivel carregar o PDF.js.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.pdfjsSrc = src;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error("Nao foi possivel carregar o PDF.js.")), { once: true });
    document.head.appendChild(script);
  });
}

async function loadPdfJs() {
  if (!window.pdfjsLib) {
    await loadScript(PDF_JS_SCRIPT_URL);
  }

  const pdfjs = window.pdfjsLib;
  if (!pdfjs) {
    throw new Error("Nao foi possivel inicializar o PDF.js.");
  }

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_URL;
  }
  return pdfjs;
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Nao foi possivel converter a pagina PDF."));
    reader.readAsDataURL(blob);
  });
}

export function buildPreparedPdfPagePayload(input: {
  pageNumber: number;
  pagePngBase64: string;
  nativeTextBlocks: NativeTextBlock[];
}): PreparedPdfPage {
  if (input.nativeTextBlocks.length > 0) {
    return {
      pageNumber: input.pageNumber,
      source: "text-layer",
      nativeTextBlocks: input.nativeTextBlocks,
      ocrRegions: [],
    };
  }

  return {
    pageNumber: input.pageNumber,
    source: "ocr",
    pagePngBase64: input.pagePngBase64,
    nativeTextBlocks: [],
    ocrRegions: [],
  };
}

export async function readPdfPageCount(file: File) {
  const pdfjs = await loadPdfJs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfDocument = await pdfjs.getDocument({ data: bytes }).promise;
  return pdfDocument.numPages;
}

export async function buildPreparedPdfPages(file: File, processablePages: number) {
  const pdfjs = await loadPdfJs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfDocument = await pdfjs.getDocument({ data: bytes }).promise;
  const pages: PreparedPdfPage[] = [];

  for (let pageNumber = 1; pageNumber <= Math.min(processablePages, pdfDocument.numPages); pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Nao foi possivel criar o canvas para o PDF.");
    }

    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (!value) {
          reject(new Error("Nao foi possivel renderizar a pagina do PDF."));
          return;
        }
        resolve(value);
      }, "image/png");
    });
    const pagePngBase64 = await blobToBase64(blob);

    const textContent = await page.getTextContent();
    const nativeTextBlocks: NativeTextBlock[] = textContent.items
      .map((item: { str?: string }, index: number) => {
        const maybeText = "str" in item && typeof item.str === "string" ? item.str.trim() : "";
        if (!maybeText) {
          return null;
        }

        return {
          text: maybeText,
          bbox: { x: 0, y: index * 14, width: canvas.width, height: 14 },
        };
      })
      .filter((block: NativeTextBlock | null): block is NativeTextBlock => block !== null);

    pages.push(
      buildPreparedPdfPagePayload({
        pageNumber,
        pagePngBase64,
        nativeTextBlocks,
      }),
    );
  }

  return pages;
}
