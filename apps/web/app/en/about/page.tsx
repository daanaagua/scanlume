import Link from "next/link";

import { buildEnglishMetadata } from "@/lib/en-metadata";

export const metadata = buildEnglishMetadata({
  title: "About Scanlume",
  description: "Learn what Scanlume does, where it is useful, and how we set expectations for online OCR.",
  keywords: ["about Scanlume", "online OCR", "image to text"],
  pathname: "/en/about",
  portuguesePathname: "/sobre",
});

export default function EnglishAboutPage() {
  return (
    <div lang="en">
      <section className="tool-first-home">
        <div className="container">
          <div className="tool-first-intro">
            <p className="eyebrow scanlume-signal-label">About Scanlume</p>
            <h1>Clean OCR for everyday image and PDF text extraction.</h1>
            <p>
              Scanlume is built for quick browser OCR: upload a screenshot, image, or lightweight PDF, extract editable text, and export the result without installing an app.
            </p>
            <div className="tool-first-pills" aria-label="Product scope">
              <span>Browser OCR</span>
              <span>Image and PDF</span>
              <span>Editable exports</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container">
          <div className="check-grid">
            <article className="check-card">
              <strong>What it does well</strong>
              <p>Extracts text from screenshots, JPG, PNG, and simple PDFs for reuse in docs, notes, and workflows.</p>
            </article>
            <article className="check-card">
              <strong>What still needs review</strong>
              <p>Dense tables, tiny text, tilted photos, and noisy scans should be checked before publishing or sharing.</p>
            </article>
            <article className="check-card">
              <strong>How to start</strong>
              <p>Use the browser tool for manual OCR and switch to the API when the same task becomes repeatable.</p>
            </article>
          </div>
          <div className="hero-actions">
            <Link href="/en/image-to-text" className="solid-button large-button">
              Open the OCR tool
            </Link>
            <Link href="/en/api" className="ghost-button large-button">
              View API guide
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
