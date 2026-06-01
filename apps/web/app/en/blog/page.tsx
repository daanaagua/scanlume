import Link from "next/link";

import { buildEnglishMetadata } from "@/lib/en-metadata";

export const metadata = buildEnglishMetadata({
  title: "Scanlume updates",
  description: "English product notes for Scanlume OCR, including workflow, pricing, API, and account updates.",
  keywords: ["Scanlume updates", "OCR updates", "image to text updates"],
  pathname: "/en/blog",
  portuguesePathname: "/blog",
});

export default function EnglishBlogPage() {
  return (
    <div lang="en">
      <section className="tool-first-home">
        <div className="container">
          <div className="tool-first-intro">
            <p className="eyebrow scanlume-signal-label">Updates</p>
            <h1>Product notes for the English Scanlume experience.</h1>
            <p>
              English long-form articles are still being curated. For now, this page tracks the core English routes and current product surface.
            </p>
            <div className="tool-first-pills" aria-label="English resources">
              <span>Workflow</span>
              <span>Pricing</span>
              <span>API</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-band muted-band">
        <div className="container">
          <div className="check-grid">
            <article className="check-card">
              <strong>Use the OCR tool</strong>
              <p>Convert screenshots, JPG, PNG, and PDF files into editable text in the browser.</p>
              <Link href="/en/image-to-text" className="blog-compact-link">
                Image to text
              </Link>
            </article>
            <article className="check-card">
              <strong>Compare plans</strong>
              <p>Review web OCR credits, API packs, and billing rules before buying.</p>
              <Link href="/en/pricing" className="blog-compact-link">
                Pricing
              </Link>
            </article>
            <article className="check-card">
              <strong>Automate OCR</strong>
              <p>Use the API guide when OCR needs to run inside an app or internal workflow.</p>
              <Link href="/en/api" className="blog-compact-link">
                API guide
              </Link>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
