import type { FormattedBlock, FormattedTableBlock } from "./schema";

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
  groupId?: string;
  groupBbox?: { x: number; y: number; width: number; height: number };
  formattedBlock?: FormattedBlock;
  rowGroups?: Array<{ label: string; rowStart: number; rowEnd: number }>;
  records?: Array<{ rowNumber: number; groupLabel: string; fields: Array<{ column: string; value: string }> }>;
};

type StructuredOcrBlockInput = FormattedBlock;

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

function isTableBlock(block: StructuredOcrBlockInput): block is FormattedTableBlock {
  return block.type === "table";
}

function buildBlockText(block: StructuredOcrBlockInput) {
  if (block.type === "table") {
    return block.title.trim() || "Table";
  }

  return block.text.trim();
}

function detectBlockLane(pageWidth: number, bbox: { x: number; y: number; width: number; height: number }): PdfLane {
  const widthRatio = pageWidth > 0 ? bbox.width / pageWidth : 1;
  if (widthRatio >= 0.6) {
    return "full";
  }

  const centerX = bbox.x + bbox.width / 2;
  return centerX <= pageWidth / 2 ? "left" : "right";
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

type ReadingItem = {
  id: string;
  blocks: PdfPageBlock[];
  bbox?: { x: number; y: number; width: number; height: number };
  lane: PdfLane;
  order: number;
};

function mergeBboxes(boxes: Array<{ x: number; y: number; width: number; height: number }>) {
  if (boxes.length === 0) {
    return undefined;
  }

  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function buildReadingItems(input: { pageWidth: number; blocks: PdfPageBlock[] }) {
  const grouped = new Map<string, PdfPageBlock[]>();
  const singles: ReadingItem[] = [];

  for (const [index, block] of input.blocks.entries()) {
    if (block.groupId) {
      const existing = grouped.get(block.groupId) ?? [];
      existing.push(block);
      grouped.set(block.groupId, existing);
      continue;
    }

    singles.push({
      id: block.id ?? `single-${index}`,
      blocks: [block],
      bbox: block.bbox,
      lane: block.bbox ? detectBlockLane(input.pageWidth, block.bbox) : "full",
      order: block.order ?? index,
    });
  }

  const groupedItems = [...grouped.entries()].map(([groupId, blocks], index) => {
    const sortedBlocks = [...blocks].sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
    const explicitGroupBox = sortedBlocks[0]?.groupBbox;
    const bbox = explicitGroupBox ?? mergeBboxes(
      sortedBlocks.flatMap((block) => (block.bbox ? [block.bbox] : [])),
    );

    return {
      id: groupId,
      blocks: sortedBlocks,
      bbox,
      lane: bbox ? detectBlockLane(input.pageWidth, bbox) : "full",
      order: sortedBlocks[0]?.order ?? index,
    } satisfies ReadingItem;
  });

  return [...groupedItems, ...singles];
}

function shouldUseDualColumnLayout(items: ReadingItem[]) {
  const leftCount = items.filter((item) => item.lane === "left").length;
  const rightCount = items.filter((item) => item.lane === "right").length;
  return leftCount >= 2 && rightCount >= 2;
}

function sortItemsRowWise(input: { pageWidth: number; items: ReadingItem[] }) {
  const rowTolerance = Math.max(18, Math.round(input.pageWidth * 0.03));

  return [...input.items].sort((left, right) => {
    if (!left.bbox || !right.bbox) {
      return left.order - right.order;
    }

    if (Math.abs(left.bbox.y - right.bbox.y) > rowTolerance) {
      return left.bbox.y - right.bbox.y;
    }

    if (left.lane !== right.lane) {
      return laneRank(left.lane) - laneRank(right.lane);
    }

    if (Math.abs(left.bbox.x - right.bbox.x) > 8) {
      return left.bbox.x - right.bbox.x;
    }

    return left.order - right.order;
  });
}

function sortItemsDualColumn(input: { items: ReadingItem[] }) {
  const fullItems = input.items
    .filter((item) => item.lane === "full")
    .sort((left, right) => (left.bbox?.y ?? left.order) - (right.bbox?.y ?? right.order));
  const remaining = input.items.filter((item) => item.lane !== "full");
  const output: ReadingItem[] = [];

  function flushSegment(maxTop?: number) {
    const segment = remaining
      .filter((item) => {
        const top = item.bbox?.y ?? item.order;
        return typeof maxTop === "number" ? top < maxTop : true;
      })
      .sort((left, right) => (left.bbox?.y ?? left.order) - (right.bbox?.y ?? right.order));
    if (segment.length === 0) {
      return;
    }

    const consumed = new Set(segment.map((item) => item.id));
    const nextRemaining = remaining.filter((item) => !consumed.has(item.id));
    remaining.length = 0;
    remaining.push(...nextRemaining);

    output.push(
      ...segment.filter((item) => item.lane === "left"),
      ...segment.filter((item) => item.lane === "right"),
    );
  }

  for (const fullItem of fullItems) {
    flushSegment(fullItem.bbox?.y);
    output.push(fullItem);
  }

  flushSegment();

  return output;
}

export function orderPageBlocksForReading(input: {
  pageWidth: number;
  blocks: PdfPageBlock[];
}) {
  const items = buildReadingItems(input);
  const orderedItems = shouldUseDualColumnLayout(items)
    ? sortItemsDualColumn({ items })
    : sortItemsRowWise({ pageWidth: input.pageWidth, items });

  let nextOrder = 0;
  return orderedItems.flatMap((item) =>
    item.blocks.map((block) => ({
      ...block,
      order: nextOrder++,
    })),
  );
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

function blockWeight(block: StructuredOcrBlockInput) {
  if (block.type === "table") {
    const rowWeight = block.cells.reduce((max, cell) => Math.max(max, cell.rowEnd), 0);
    return Math.max(2.8, rowWeight * 0.9 + block.rowGroups.length * 0.4 + block.records.length * 0.2);
  }

  if (block.type === "h1") return 1.4;
  if (block.type === "h2") return 1.2;
  if (block.type === "br") return 0.35;
  return Math.max(1, Math.min(3.2, Math.ceil(block.text.trim().length / 80)));
}

export function mapStructuredOcrBlocks(input: {
  idPrefix: string;
  orderOffset: number;
  source: "ocr";
  regionBbox: { x: number; y: number; width: number; height: number };
  blocks: StructuredOcrBlockInput[];
}) {
  const meaningfulBlocks = input.blocks.filter((block) => {
    if (block.type === "br") {
      return true;
    }

    if (isTableBlock(block)) {
      return block.cells.length > 0;
    }

    return block.text.trim().length > 0;
  });
  if (meaningfulBlocks.length === 0) {
    return [] as PdfPageBlock[];
  }

  const totalWeight = meaningfulBlocks.reduce((sum, block) => sum + blockWeight(block), 0);
  let cursorY = input.regionBbox.y;

  return meaningfulBlocks.map((block, index) => {
    const weight = blockWeight(block);
    const rawHeight = (weight / totalWeight) * input.regionBbox.height;
    const remainingHeight = input.regionBbox.y + input.regionBbox.height - cursorY;
    const height = index === meaningfulBlocks.length - 1 ? remainingHeight : Math.max(12, rawHeight);
    const blockOrder = input.orderOffset + index;
    const blockText = buildBlockText(block);

    const mappedBlock: PdfPageBlock = {
      id: `${input.idPrefix}-${index}`,
      kind: block.type,
      order: blockOrder,
      text: blockText,
      source: input.source,
      groupId: input.idPrefix,
      groupBbox: input.regionBbox,
      formattedBlock: {
        ...block,
        order: blockOrder,
      },
      rowGroups: isTableBlock(block) ? block.rowGroups : undefined,
      records: isTableBlock(block) ? block.records : undefined,
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
