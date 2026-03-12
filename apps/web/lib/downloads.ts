import JSZip from "jszip";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(filename: string, content: string, mimeType = "text/plain;charset=utf-8") {
  triggerDownload(new Blob([content], { type: mimeType }), filename);
}

export function downloadHtmlFile(filename: string, body: string) {
  const documentHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${filename}</title></head><body>${body}</body></html>`;
  triggerDownload(new Blob([documentHtml], { type: "text/html;charset=utf-8" }), filename);
}

export async function downloadBatchZip(
  archiveName: string,
  items: Array<{
    baseName: string;
    txt: string;
    md?: string;
    html?: string;
  }>,
) {
  const zip = new JSZip();

  for (const item of items) {
    zip.file(`${item.baseName}.txt`, item.txt);
    if (item.md) {
      zip.file(`${item.baseName}.md`, item.md);
    }
    if (item.html) {
      zip.file(`${item.baseName}.html`, item.html);
    }
  }

  const content = await zip.generateAsync({ type: "blob" });
  triggerDownload(content, archiveName);
}
