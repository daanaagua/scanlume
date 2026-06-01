import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { OcrWorkspace } from "@/components/ocr-workspace";
import { buildEnglishMetadata } from "@/lib/en-metadata";
import { OCR_WORKSPACE_ID, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata = buildEnglishMetadata({
  title: "Image to text OCR online | Scanlume",
  description:
    "Turn screenshots, JPG, PNG, and PDF into editable text online. Choose the OCR language, edit the result, and download TXT, Markdown, HTML, or PDF.",
  keywords: ["image to text", "convert image to text", "screenshot OCR", "JPG to text", "PNG to text"],
  pathname: "/en/image-to-text",
  portuguesePathname: "/imagem-para-texto",
});

export default function EnglishImageToTextPage() {
  const canonical = `${SITE_URL}/en/image-to-text`;

  return (
    <div lang="en">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `${SITE_NAME} Image to text`,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Any",
          url: canonical,
          inLanguage: "en",
          description: "Convert image to text online with editable TXT, Markdown, HTML, and PDF outputs.",
          featureList: ["Simple OCR", "Formatted Text", "Language-aware OCR", "Editable exports"],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en` },
            { "@type": "ListItem", position: 2, name: "Image to text", item: canonical },
          ],
        }}
      />

      <section id={OCR_WORKSPACE_ID} className="tool-first-landing">
        <div className="container tool-first-landing-inner">
          <div className="tool-first-intro tool-first-intro-compact">
            <p className="eyebrow">Image to text</p>
            <h1>Convert image to text online</h1>
            <p>
              Upload JPG, PNG, screenshots, or PDF and extract editable text with Simple OCR or Formatted Text.
            </p>
            <div className="tool-first-pills" aria-label="Image to text features">
              <span>Auto, PT, EN, ES</span>
              <span>Edit before export</span>
              <span>Retry failed files</span>
            </div>
          </div>

          <div className="tool-first-workspace">
            <OcrWorkspace defaultMode="simple" locale="en" priorityLayout />
          </div>
        </div>
      </section>

      <section className="tool-helper-section">
        <div className="container">
          <div className="tool-helper-grid">
            <article className="helper-card">
              <div className="helper-card-header">
                <span className="helper-eyebrow">When to use it</span>
                <h2>Use one workflow for screenshots, photos, and lightweight documents.</h2>
                <p className="helper-lead">
                  Simple OCR is best for quick plain text. Formatted Text is better when headings, paragraphs, or PDF structure matter.
                </p>
              </div>
            </article>
            <article className="helper-card">
              <div className="helper-card-header">
                <span className="helper-eyebrow">Automation</span>
                <h2>Need OCR inside your product or internal workflow?</h2>
                <p className="helper-lead">
                  Use the browser tool for manual jobs and the <Link href="/en/api">Scanlume API</Link> for automated OCR.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
