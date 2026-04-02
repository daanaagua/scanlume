export type PdfLane = "full" | "left" | "right";

export type LayoutRegion = {
  id: string;
  top: number;
  left: number;
  width: number;
  lane: PdfLane;
};

export type PdfPageStatus = "success" | "partial" | "failed";
export type PdfPageSource = "text-layer" | "ocr" | "mixed";

export type PdfPageBlock = {
  id?: string;
  kind?: string;
  order?: number;
  text?: string;
  source?: "text-layer" | "ocr";
  bbox?: { x: number; y: number; width: number; height: number };
};

type StructuredOcrBlockInput = {
  type: string;
  text: string;
  order: number;
};

export type PageBuildInput = {
  pageNumber: number;
  status: PdfPageStatus;
  source: PdfPageSource;
  width: number;
  height: number;
  text?: string;
  markdown?: string;
  html?: string;
  errorCode?: string;
  errorMessage?: string;
  blocks?: PdfPageBlock[];
};

function laneRank(lane: PdfLane) {
  if (lane === "full") return 0;
  if (lane === "left") return 1;
  return 2;
}

export function orderRegionsForReading(regions: LayoutRegion[]) {
  return [...regions].sort((left, right) => {
    if (Math.abs(left.top - right.top) > 24) {
      return left.top - right.top;
    }

    if (left.lane !== right.lane) {
      return laneRank(left.lane) - laneRank(right.lane);
    }

    return left.left - right.left;
  });
}

export function buildPdfPageResult(input: PageBuildInput) {
  if (input.status === "failed") {
    return {
      pageNumber: input.pageNumber,
      status: input.status,
      source: input.source,
      width: input.width,
      height: input.height,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
      blocks: input.blocks ?? [],
    };
  }

  return {
    pageNumber: input.pageNumber,
    status: input.status,
    source: input.source,
    width: input.width,
    height: input.height,
    text: input.text ?? "",
    markdown: input.markdown ?? "",
    html: input.html ?? "",
    blocks: input.blocks ?? [],
  };
}

function blockWeight(kind: string, text: string) {
  if (kind === "h1") return 1.4;
  if (kind === "h2") return 1.2;
  if (kind === "br") return 0.35;
  return Math.max(1, Math.min(3.2, Math.ceil(text.trim().length / 80)));
}

export function mapStructuredOcrBlocks(input: {
  idPrefix: string;
  orderOffset: number;
  source: "ocr";
  regionBbox: { x: number; y: number; width: number; height: number };
  blocks: StructuredOcrBlockInput[];
}) {
  const meaningfulBlocks = input.blocks.filter((block) => block.text.trim().length > 0 || block.type === "br");
  if (meaningfulBlocks.length === 0) {
    return [] as PdfPageBlock[];
  }

  const totalWeight = meaningfulBlocks.reduce((sum, block) => sum + blockWeight(block.type, block.text), 0);
  let cursorY = input.regionBbox.y;

  return meaningfulBlocks.map((block, index) => {
    const weight = blockWeight(block.type, block.text);
    const rawHeight = (weight / totalWeight) * input.regionBbox.height;
    const remainingHeight = input.regionBbox.y + input.regionBbox.height - cursorY;
    const height = index === meaningfulBlocks.length - 1 ? remainingHeight : Math.max(12, rawHeight);

    const mappedBlock: PdfPageBlock = {
      id: `${input.idPrefix}-${index}`,
      kind: block.type,
      order: input.orderOffset + index,
      text: block.text,
      source: input.source,
      bbox: {
        x: input.regionBbox.x,
        y: cursorY,
        width: input.regionBbox.width,
        height,
      },
    };

    cursorY += height;
    return mappedBlock;
  });
}
