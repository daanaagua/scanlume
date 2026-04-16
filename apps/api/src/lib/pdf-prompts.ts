export function buildPdfRegionPrompt(input: { pageNumber: number; regionKind: "page" | "region" }) {
  return input.regionKind === "region"
    ? `Extract only the text visible inside this cropped PDF region from page ${input.pageNumber}. Preserve headings, paragraphs, line breaks, tables, captions, and reading order. This document may contain pt-BR Portuguese text, so preserve accents, cedillas, and other diacritics exactly as shown. Do not summarize, normalize, or omit edge text, clipped text, or partial words near the crop boundary.`
    : `Extract the text visible on PDF page ${input.pageNumber}. Preserve headings, paragraphs, line breaks, tables, captions, and reading order. This document may contain pt-BR Portuguese text, so preserve accents, cedillas, and other diacritics exactly as shown. Do not summarize, normalize, or omit edge text, clipped text, or partial words near the page boundary.`;
}
