import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { OcrWorkspace } from "@/components/ocr-workspace";
import { buildEnglishMetadata } from "@/lib/en-metadata";
import { OCR_WORKSPACE_ID, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata = buildEnglishMetadata({
  title: "Scanlume | Online OCR for images and PDF",
  description:
    "Convert images and PDF to editable text online. Use Simple OCR or Formatted Text, choose the OCR language, edit the result, and export TXT, Markdown, HTML, or PDF.",
  keywords: ["online OCR", "image to text", "PDF OCR", "OCR API", "formatted OCR"],
  pathname: "/en",
  portuguesePathname: "/",
});

export default function EnglishHomePage() {
  return (
    <div lang="en">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `${SITE_NAME} OCR`,
          url: `${SITE_URL}/en`,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Any",
          inLanguage: "en",
          description: "Online OCR for images and PDF with editable TXT, Markdown, HTML, and PDF outputs.",
          featureList: [
            "Image to text OCR",
            "PDF OCR",
            "Language-aware extraction",
            "Editable TXT, Markdown, and HTML output",
          ],
        }}
      />

      <section id={OCR_WORKSPACE_ID} className="tool-first-home">
        <div className="container tool-first-home-inner">
          <div className="tool-first-intro">
            <p className="eyebrow scanlume-signal-label">Scanlume OCR</p>
            <h1>Online OCR for images and PDF</h1>
            <p>
              Upload an image or PDF, choose the OCR language, edit the extracted text, and export it in the format you need.
            </p>
            <div className="tool-first-pills" aria-label="Core features">
              <span>No install</span>
              <span>Image and PDF</span>
              <span>TXT, MD, HTML, PDF</span>
            </div>
          </div>

          <div className="tool-first-workspace">
            <OcrWorkspace defaultMode="simple" locale="en" priorityLayout />
          </div>
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Workflow</p>
            <h2>Upload, OCR, edit, and export without leaving the page.</h2>
            <p>
              Scanlume is built for quick extraction from screenshots, photos, designs, and PDF documents. Use the browser tool for manual work or the API for automation.
            </p>
            <div className="hero-actions">
              <Link href="/en/image-to-text" className="ghost-button large-button">
                Image to text
              </Link>
              <Link href="/en/api" className="ghost-button large-button">
                OCR API
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
