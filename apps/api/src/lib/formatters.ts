import type { FormattedBlock } from "./schema";

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

export function blocksToHtml(blocks: FormattedBlock[]) {
  return sortBlocks(blocks)
    .map((block) => {
      if (block.type === "br") {
        return "<br />";
      }

      const text = escapeHtml(normalizeText(block.text));
      return `<${block.type}>${text}</${block.type}>`;
    })
    .join("\n");
}

export function blocksToMarkdown(blocks: FormattedBlock[]) {
  return sortBlocks(blocks)
    .map((block) => {
      const text = normalizeText(block.text);
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
    .map((block) => (block.type === "br" ? "" : normalizeText(block.text)))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
