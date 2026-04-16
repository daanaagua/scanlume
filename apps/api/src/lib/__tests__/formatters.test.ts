import { describe, expect, it } from "vitest";

import { blocksToHtml, blocksToMarkdown, blocksToText, collectTableStats } from "../formatters";
import { formattedBlocksEnvelopeSchema } from "../schema";

const groupedSalesTable = {
  type: "table" as const,
  order: 1,
  title: "Resumo de vendas",
  columns: ["Categoria", "Data de venda", "Unit price", "Quantidade", "Amount"],
  headerRows: [1],
  cells: [
    { rowStart: 1, rowEnd: 1, colStart: 1, colEnd: 1, text: "Categoria", isHeader: true, align: "left" as const },
    { rowStart: 1, rowEnd: 1, colStart: 2, colEnd: 2, text: "Data de venda", isHeader: true, align: "left" as const },
    { rowStart: 1, rowEnd: 1, colStart: 3, colEnd: 3, text: "Unit price", isHeader: true, align: "right" as const },
    { rowStart: 1, rowEnd: 1, colStart: 4, colEnd: 4, text: "Quantidade", isHeader: true, align: "right" as const },
    { rowStart: 1, rowEnd: 1, colStart: 5, colEnd: 5, text: "Amount", isHeader: true, align: "right" as const },
    { rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 1, text: "Frutas", isHeader: false, align: "left" as const },
    { rowStart: 2, rowEnd: 2, colStart: 2, colEnd: 2, text: "2026-04-01", isHeader: false, align: "left" as const },
    { rowStart: 2, rowEnd: 2, colStart: 3, colEnd: 3, text: "5.00", isHeader: false, align: "right" as const },
    { rowStart: 2, rowEnd: 2, colStart: 4, colEnd: 4, text: "4", isHeader: false, align: "right" as const },
    { rowStart: 2, rowEnd: 2, colStart: 5, colEnd: 5, text: "20.00", isHeader: false, align: "right" as const },
    { rowStart: 3, rowEnd: 3, colStart: 2, colEnd: 2, text: "2026-04-03", isHeader: false, align: "left" as const },
    { rowStart: 3, rowEnd: 3, colStart: 3, colEnd: 3, text: "6.00", isHeader: false, align: "right" as const },
    { rowStart: 3, rowEnd: 3, colStart: 4, colEnd: 4, text: "3", isHeader: false, align: "right" as const },
    { rowStart: 3, rowEnd: 3, colStart: 5, colEnd: 5, text: "18.00", isHeader: false, align: "right" as const },
  ],
  rowGroups: [{ label: "Frutas", rowStart: 2, rowEnd: 3 }],
  records: [
    {
      rowNumber: 2,
      groupLabel: "Frutas",
      fields: [
        { column: "Data de venda", value: "2026-04-01" },
        { column: "Unit price", value: "5.00" },
        { column: "Quantidade", value: "4" },
        { column: "Amount", value: "20.00" },
      ],
    },
    {
      rowNumber: 3,
      groupLabel: "Frutas",
      fields: [
        { column: "Data de venda", value: "2026-04-03" },
        { column: "Unit price", value: "6.00" },
        { column: "Quantidade", value: "3" },
        { column: "Amount", value: "18.00" },
      ],
    },
  ],
  notes: ["Valores em BRL."],
};

describe("formatted blocks schema", () => {
  it("accepts mixed text and table blocks in one payload", () => {
    const parsed = formattedBlocksEnvelopeSchema.safeParse({
      blocks: [
        { type: "h1", text: "Relatorio", order: 0 },
        groupedSalesTable,
        { type: "p", text: "Observacao final", order: 2 },
      ],
    });

    expect(parsed.success).toBe(true);
  });
});

describe("table-aware formatters", () => {
  const blocks = [
    { type: "h1" as const, text: "Relatorio de vendas", order: 0 },
    groupedSalesTable,
    { type: "p" as const, text: "Observacao final", order: 2 },
  ];

  it("renders HTML tables with rowspan and semantic table tags", () => {
    const html = blocksToHtml(blocks);

    expect(html).toContain("<table>");
    expect(html).toContain('rowspan="2"');
    expect(html).toContain("<thead>");
    expect(html).toContain("Resumo de vendas");
  });

  it("renders Markdown with flattened grouped rows", () => {
    const markdown = blocksToMarkdown(blocks);

    expect(markdown).toContain("| Categoria | Data de venda | Unit price | Quantidade | Amount |");
    expect(markdown).toContain("| Frutas | 2026-04-01 | 5.00 | 4 | 20.00 |");
    expect(markdown).toContain("| Frutas | 2026-04-03 | 6.00 | 3 | 18.00 |");
  });

  it("renders text output with readable row summaries", () => {
    const text = blocksToText(blocks);

    expect(text).toContain("Resumo de vendas");
    expect(text).toContain("Categoria | Data de venda | Unit price | Quantidade | Amount");
    expect(text).toContain("Frutas | 2026-04-03 | 6.00 | 3 | 18.00");
  });

  it("counts detected tables, row groups, and expanded records", () => {
    expect(collectTableStats(blocks)).toEqual({
      tableCount: 1,
      rowGroupCount: 1,
      recordCount: 2,
    });
  });
});
