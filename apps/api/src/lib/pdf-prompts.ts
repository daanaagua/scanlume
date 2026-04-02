export function buildPdfRegionPrompt(input: { pageNumber: number; regionKind: "page" | "region" }) {
  return input.regionKind === "region"
    ? `Extract only the text visible inside this cropped PDF region from page ${input.pageNumber}. Preserve headings, paragraphs, line breaks, and reading order. Do not summarize or omit edge text.`
    : `Extract the text visible on PDF page ${input.pageNumber}. Preserve headings, paragraphs, line breaks, and reading order. Do not summarize or omit edge text.`;
}
