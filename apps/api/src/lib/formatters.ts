import type {
  FormattedBlock,
  FormattedTableBlock,
  FormattedTableCell,
  FormattedTextBlock,
} from "./schema";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

export function sortBlocks(blocks: FormattedBlock[]) {
  return [...blocks].sort((left, right) => left.order - right.order);
}

function isTableBlock(block: FormattedBlock): block is FormattedTableBlock {
  return block.type === "table";
}

function isTextBlock(block: FormattedBlock): block is FormattedTextBlock {
  return block.type !== "table";
}

function normalizeBlockText(block: FormattedBlock) {
  if (isTextBlock(block)) {
    return normalizeText(block.text);
  }

  return normalizeText(block.title);
}

function escapeMarkdownCell(value: string) {
  return value.replaceAll("|", "\\|");
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}

function getTableSize(block: FormattedTableBlock) {
  const rowCount = block.cells.reduce((max, cell) => Math.max(max, cell.rowEnd), 0);
  const colCount = Math.max(block.columns.length, block.cells.reduce((max, cell) => Math.max(max, cell.colEnd), 0));

  return {
    rowCount,
    colCount,
  };
}

function flattenTableRows(block: FormattedTableBlock) {
  const { rowCount, colCount } = getTableSize(block);
  const rows = Array.from({ length: rowCount }, () => Array.from({ length: colCount }, () => ""));

  for (const cell of block.cells) {
    const text = normalizeText(cell.text);
    for (let row = cell.rowStart; row <= cell.rowEnd; row += 1) {
      for (let col = cell.colStart; col <= cell.colEnd; col += 1) {
        rows[row - 1]![col - 1] = text;
      }
    }
  }

  return rows;
}

function resolveTableHeaders(block: FormattedTableBlock, flattenedRows: string[][]) {
  if (block.columns.length > 0) {
    return block.columns.map((column) => normalizeText(column));
  }

  const firstRow = flattenedRows[0] ?? [];
  return firstRow.map((cell, index) => cell || `Column ${index + 1}`);
}

function inferHeaderRowCount(block: FormattedTableBlock) {
  if (block.headerRows.length === 0) {
    const firstRowCells = block.cells.filter((cell) => cell.rowStart === 1);
    return firstRowCells.length > 0 && firstRowCells.every((cell) => cell.isHeader) ? 1 : 0;
  }

  let count = 0;
  while (block.headerRows.includes(count + 1)) {
    count += 1;
  }
  return count;
}

function renderTableRowsHtml(rows: number[], cellsByRow: Map<number, FormattedTableCell[]>, headerRows: Set<number>) {
  return rows
    .map((rowNumber) => {
      const cells = (cellsByRow.get(rowNumber) ?? []).sort((left, right) => left.colStart - right.colStart);
      const renderedCells = cells
        .map((cell) => {
          const tagName = headerRows.has(rowNumber) || cell.isHeader ? "th" : "td";
          const attrs: string[] = [];
          const rowSpan = cell.rowEnd - cell.rowStart + 1;
          const colSpan = cell.colEnd - cell.colStart + 1;
          if (rowSpan > 1) {
            attrs.push(`rowspan="${rowSpan}"`);
          }
          if (colSpan > 1) {
            attrs.push(`colspan="${colSpan}"`);
          }
          if (cell.align !== "left") {
            attrs.push(`data-align="${escapeAttribute(cell.align)}"`);
          }
          const attrText = attrs.length > 0 ? ` ${attrs.join(" ")}` : "";

          return `<${tagName}${attrText}>${escapeHtml(normalizeText(cell.text))}</${tagName}>`;
        })
        .join("");

      return `<tr>${renderedCells}</tr>`;
    })
    .join("\n");
}

function tableToHtml(block: FormattedTableBlock) {
  const title = normalizeText(block.title);
  const cellsByRow = new Map<number, FormattedTableCell[]>();
  for (const cell of block.cells) {
    const existing = cellsByRow.get(cell.rowStart) ?? [];
    existing.push(cell);
    cellsByRow.set(cell.rowStart, existing);
  }

  const { rowCount } = getTableSize(block);
  const rows = Array.from({ length: rowCount }, (_, index) => index + 1);
  const headerRowCount = inferHeaderRowCount(block);
  const headerRows = new Set(Array.from({ length: headerRowCount }, (_, index) => index + 1));
  const headRows = rows.filter((row) => headerRows.has(row));
  const bodyRows = rows.filter((row) => !headerRows.has(row));
  const fragments: string[] = ['<section class="ocr-table-block" data-ocr-block="table">'];

  if (title) {
    fragments.push(`<p class="ocr-table-title">${escapeHtml(title)}</p>`);
  }

  fragments.push("<table>");
  if (headRows.length > 0) {
    fragments.push(`<thead>${renderTableRowsHtml(headRows, cellsByRow, headerRows)}</thead>`);
  }
  fragments.push(`<tbody>${renderTableRowsHtml(bodyRows.length > 0 ? bodyRows : rows, cellsByRow, headerRows)}</tbody>`);
  fragments.push("</table>");

  if (block.notes.length > 0) {
    fragments.push(
      `<div class="ocr-table-notes">${block.notes
        .map((note) => `<p>${escapeHtml(normalizeText(note))}</p>`)
        .join("")}</div>`,
    );
  }

  fragments.push("</section>");
  return fragments.join("\n");
}

function tableToMarkdown(block: FormattedTableBlock) {
  const flattenedRows = flattenTableRows(block);
  const headers = resolveTableHeaders(block, flattenedRows);
  const headerRowCount = inferHeaderRowCount(block);
  const startRow = headerRowCount > 0 ? headerRowCount : block.columns.length > 0 ? 0 : 1;
  const markdownRows = flattenedRows.slice(startRow).filter((row) => row.some((cell) => cell.trim().length > 0));
  const lines: string[] = [];

  if (block.title.trim()) {
    lines.push(`### ${normalizeText(block.title)}`);
    lines.push("");
  }

  lines.push(`| ${headers.map((header) => escapeMarkdownCell(header)).join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const row of markdownRows) {
    const paddedRow = headers.map((_, index) => escapeMarkdownCell(normalizeText(row[index] ?? "")));
    lines.push(`| ${paddedRow.join(" | ")} |`);
  }

  if (block.notes.length > 0) {
    lines.push("");
    for (const note of block.notes) {
      lines.push(`- ${normalizeText(note)}`);
    }
  }

  return lines.join("\n").trim();
}

function tableToText(block: FormattedTableBlock) {
  const flattenedRows = flattenTableRows(block);
  const headers = resolveTableHeaders(block, flattenedRows);
  const headerRowCount = inferHeaderRowCount(block);
  const startRow = headerRowCount > 0 ? headerRowCount : block.columns.length > 0 ? 0 : 1;
  const bodyRows = flattenedRows.slice(startRow).filter((row) => row.some((cell) => cell.trim().length > 0));
  const lines: string[] = [];

  if (block.title.trim()) {
    lines.push(normalizeText(block.title));
  }

  lines.push(headers.join(" | "));
  for (const row of bodyRows) {
    lines.push(headers.map((_, index) => normalizeText(row[index] ?? "")).join(" | "));
  }

  if (block.notes.length > 0) {
    lines.push(...block.notes.map((note) => `Note: ${normalizeText(note)}`));
  }

  return lines.join("\n").trim();
}

export function blocksToHtml(blocks: FormattedBlock[]) {
  return sortBlocks(blocks)
    .map((block) => {
      if (isTableBlock(block)) {
        return tableToHtml(block);
      }

      if (block.type === "br") {
        return "<br />";
      }

      const text = escapeHtml(normalizeBlockText(block));
      return `<${block.type}>${text}</${block.type}>`;
    })
    .join("\n");
}

export function blocksToMarkdown(blocks: FormattedBlock[]) {
  return sortBlocks(blocks)
    .map((block) => {
      if (isTableBlock(block)) {
        return tableToMarkdown(block);
      }

      const text = normalizeBlockText(block);
      if (block.type === "h1") {
        return `# ${text}`;
      }

      if (block.type === "h2") {
        return `## ${text}`;
      }

      if (block.type === "br") {
        return "";
      }

      return text;
    })
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function blocksToText(blocks: FormattedBlock[]) {
  return sortBlocks(blocks)
    .map((block) => {
      if (isTableBlock(block)) {
        return tableToText(block);
      }

      return block.type === "br" ? "" : normalizeBlockText(block);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function collectTableStats(blocks: FormattedBlock[]) {
  return blocks.reduce(
    (summary, block) => {
      if (!isTableBlock(block)) {
        return summary;
      }

      return {
        tableCount: summary.tableCount + 1,
        rowGroupCount: summary.rowGroupCount + block.rowGroups.length,
        recordCount: summary.recordCount + block.records.length,
      };
    },
    {
      tableCount: 0,
      rowGroupCount: 0,
      recordCount: 0,
    },
  );
}

export function extractResponseText(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return "";
  }

  const direct = Reflect.get(payload, "output_text");
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const output = Reflect.get(payload, "output");
  if (Array.isArray(output)) {
    const parts: string[] = [];
    for (const item of output) {
      if (typeof item !== "object" || item === null) {
        continue;
      }

      const content = Reflect.get(item, "content");
      if (!Array.isArray(content)) {
        continue;
      }

      for (const block of content) {
        if (typeof block !== "object" || block === null) {
          continue;
        }

        const type = Reflect.get(block, "type");
        const text = Reflect.get(block, "text");
        if (type === "output_text" && typeof text === "string") {
          parts.push(text);
        }
      }
    }

    return parts.join("\n").trim();
  }

  return "";
}
