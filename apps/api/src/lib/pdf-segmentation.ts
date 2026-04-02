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
