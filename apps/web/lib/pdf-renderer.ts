type NativeTextBlock = {
  text: string;
  bbox: { x: number; y: number; width: number; height: number };
};

type OcrRegion = {
  id: string;
  imageBase64: string;
  bbox: { x: number; y: number; width: number; height: number };
};

type PreparedPdfPage = {
  pageNumber: number;
  source: "text-layer" | "ocr" | "mixed";
  width: number;
  height: number;
  pagePngBase64?: string;
  nativeTextBlocks: NativeTextBlock[];
  ocrRegions: OcrRegion[];
};

type PdfRenderViewport = {
  width: number;
  height: number;
};

type PdfPageRenderInput = {
  canvasContext: CanvasRenderingContext2D;
  viewport: PdfRenderViewport;
  intent?: "display" | "print";
};

type PdfTextItem = {
  str?: string;
  width?: number;
  height?: number;
  transform?: number[];
};

declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (input: { data: Uint8Array }) => {
        promise: Promise<{
          numPages: number;
          getPage: (pageNumber: number) => Promise<{
            getViewport: (input: { scale: number }) => PdfRenderViewport;
            render: (input: PdfPageRenderInput) => { promise: Promise<void> };
            getTextContent: () => Promise<{ items: PdfTextItem[] }>;
          }>;
        }>;
      };
    };
  }
}

const PDF_JS_SCRIPT_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDF_JS_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
export const PDF_PAGE_RENDER_INTENT = "print";

export function buildPdfPageRenderInput(input: {
  canvasContext: CanvasRenderingContext2D;
  viewport: PdfRenderViewport;
}): PdfPageRenderInput {
  return {
    canvasContext: input.canvasContext,
    viewport: input.viewport,
    intent: PDF_PAGE_RENDER_INTENT,
  };
}

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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

export function buildNativeTextBlocks(items: PdfTextItem[], canvas: HTMLCanvasElement, renderScale = 1) {
  return items
    .map((item, index) => {
      const maybeText = typeof item.str === "string" ? item.str.trim() : "";
      if (!maybeText) {
        return null;
      }

      const transform = Array.isArray(item.transform) && item.transform.length >= 6 ? item.transform : null;
      const fallbackHeight = typeof item.height === "number" && Number.isFinite(item.height) ? Math.abs(item.height) : 14;
      const rawHeight = Math.max(Math.ceil(Math.abs(transform?.[3] ?? fallbackHeight) * renderScale), 12);
      const rawWidth = Math.max(Math.ceil((typeof item.width === "number" && Number.isFinite(item.width) ? item.width : maybeText.length * 8) * renderScale), 12);
      const x = clamp(Math.floor((transform?.[4] ?? 0) * renderScale), 0, Math.max(canvas.width - 1, 0));
      const pdfY = typeof transform?.[5] === "number" && Number.isFinite(transform[5]) ? transform[5] * renderScale : (index + 1) * 18;
      const y = clamp(Math.floor(canvas.height - pdfY - rawHeight), 0, Math.max(canvas.height - rawHeight, 0));

      return {
        text: maybeText,
        bbox: {
          x,
          y,
          width: Math.min(rawWidth, Math.max(canvas.width - x, 12)),
          height: Math.min(rawHeight, Math.max(canvas.height - y, 12)),
        },
      } satisfies NativeTextBlock;
    })
    .filter((block: NativeTextBlock | null): block is NativeTextBlock => block !== null);
}

function detectRasterRegion(input: {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  nativeTextBlocks: NativeTextBlock[];
}) {
  const blockPadding = 12;
  let minX = input.width;
  let minY = input.height;
  let maxX = -1;
  let maxY = -1;

  const isCoveredByNativeText = (x: number, y: number) =>
    input.nativeTextBlocks.some((block) =>
      x >= block.bbox.x - blockPadding &&
      x <= block.bbox.x + block.bbox.width + blockPadding &&
      y >= block.bbox.y - blockPadding &&
      y <= block.bbox.y + block.bbox.height + blockPadding,
    );

  for (let y = 0; y < input.height; y += 2) {
    for (let x = 0; x < input.width; x += 2) {
      if (isCoveredByNativeText(x, y)) {
        continue;
      }

      const offset = (y * input.width + x) * 4;
      const alpha = input.pixels[offset + 3] ?? 0;
      if (alpha < 24) {
        continue;
      }

      const red = input.pixels[offset] ?? 255;
      const green = input.pixels[offset + 1] ?? 255;
      const blue = input.pixels[offset + 2] ?? 255;
      const isNearlyWhite = red > 244 && green > 244 && blue > 244;
      if (isNearlyWhite) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  const bbox = {
    x: clamp(minX - 24, 0, input.width),
    y: clamp(minY - 24, 0, input.height),
    width: clamp(maxX - minX + 48, 1, input.width),
    height: clamp(maxY - minY + 48, 1, input.height),
  };

  if (bbox.width < 24 || bbox.height < 16) {
    return null;
  }

  return bbox;
}

async function cropCanvasRegionToBase64(canvas: HTMLCanvasElement, bbox: { x: number; y: number; width: number; height: number }) {
  const cropped = document.createElement("canvas");
  cropped.width = Math.max(Math.floor(bbox.width), 1);
  cropped.height = Math.max(Math.floor(bbox.height), 1);
  const context = cropped.getContext("2d");
  if (!context) {
    throw new Error("Nao foi possivel criar o recorte OCR do PDF.");
  }

  context.drawImage(canvas, bbox.x, bbox.y, bbox.width, bbox.height, 0, 0, cropped.width, cropped.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    cropped.toBlob((value) => {
      if (!value) {
        reject(new Error("Nao foi possivel recortar a regiao OCR do PDF."));
        return;
      }
      resolve(value);
    }, "image/png");
  });

  return blobToBase64(blob);
}

export function buildPreparedPdfPagePayload(input: {
  pageNumber: number;
  pagePngBase64: string;
  width: number;
  height: number;
  nativeTextBlocks: NativeTextBlock[];
  ocrRegions?: OcrRegion[];
}): PreparedPdfPage {
  const ocrRegions = input.ocrRegions ?? [];
  if (input.nativeTextBlocks.length > 0 && ocrRegions.length > 0) {
    return {
      pageNumber: input.pageNumber,
      source: "mixed",
      width: input.width,
      height: input.height,
      nativeTextBlocks: input.nativeTextBlocks,
      ocrRegions,
    };
  }

  if (input.nativeTextBlocks.length > 0) {
    return {
      pageNumber: input.pageNumber,
      source: "text-layer",
      width: input.width,
      height: input.height,
      nativeTextBlocks: input.nativeTextBlocks,
      ocrRegions: [],
    };
  }

  return {
    pageNumber: input.pageNumber,
    source: "ocr",
    width: input.width,
    height: input.height,
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
  const renderScale = 1.5;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfDocument = await pdfjs.getDocument({ data: bytes }).promise;
  const pages: PreparedPdfPage[] = [];

  for (let pageNumber = 1; pageNumber <= Math.min(processablePages, pdfDocument.numPages); pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: renderScale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Nao foi possivel criar o canvas para o PDF.");
    }

    await page.render(buildPdfPageRenderInput({ canvasContext: context, viewport })).promise;
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
    const nativeTextBlocks = buildNativeTextBlocks(textContent.items, canvas, renderScale);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const rasterRegion = detectRasterRegion({
      pixels: imageData.data,
      width: canvas.width,
      height: canvas.height,
      nativeTextBlocks,
    });
    const ocrRegions = rasterRegion
      ? [
          {
            id: `page-${pageNumber}-region-1`,
            imageBase64: await cropCanvasRegionToBase64(canvas, rasterRegion),
            bbox: rasterRegion,
          },
        ]
      : [];

    pages.push(
      buildPreparedPdfPagePayload({
        pageNumber,
        pagePngBase64,
        width: canvas.width,
        height: canvas.height,
        nativeTextBlocks,
        ocrRegions: nativeTextBlocks.length > 0 ? ocrRegions : [],
      }),
    );
  }

  return pages;
}
