export async function readPdfPageCount(_file: File) {
  return 1;
}

export async function buildPreparedPdfPages(_file: File, processablePages: number) {
  return Array.from({ length: processablePages }, (_, index) => ({
    pageNumber: index + 1,
    source: "ocr" as const,
    pagePngBase64: "",
    nativeTextBlocks: [],
    ocrRegions: [],
  }));
}
