import { NAV_LINKS, SITE_NAME, SITE_URL, TRUST_LINKS } from "@/lib/site";

export function GET() {
  const body = [
    `# ${SITE_NAME}`,
    "",
    "OCR tool site in pt-BR for imagem para texto.",
    "",
    "## Core pages",
    ...NAV_LINKS.map((link) => `- ${SITE_URL}${link.href} - ${link.label}`),
    "",
    "## Trust pages",
    ...TRUST_LINKS.map((link) => `- ${SITE_URL}${link.href} - ${link.label}`),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
