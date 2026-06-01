import Link from "next/link";

import { CodeExampleTabs } from "@/components/code-example-tabs";
import { JsonLd } from "@/components/json-ld";
import { buildEnglishMetadata } from "@/lib/en-metadata";
import { API_CODE_EXAMPLES, EN_API_INPUT_NOTE } from "@/lib/pricing";

export const metadata = buildEnglishMetadata({
  title: "Scanlume OCR API | examples and guide",
  description:
    "Integrate Scanlume OCR with an API key and base64 data URL. See cURL, JavaScript, and Python examples for Simple OCR and Formatted Text.",
  keywords: ["Scanlume API", "OCR API", "image OCR API", "base64 data URL", "API key"],
  pathname: "/en/api",
  portuguesePathname: "/api",
});

export default function EnglishApiPage() {
  const canonical = "https://www.scanlume.com/en/api";

  return (
    <div lang="en">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Scanlume OCR API",
          serviceType: "OCR API",
          provider: {
            "@type": "Organization",
            name: "Scanlume",
            url: "https://www.scanlume.com",
          },
          url: canonical,
          inLanguage: "en",
          areaServed: "Worldwide",
          description: "Integrate Scanlume OCR with an API key, base64 data URL input, and optional OCR language selection.",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.scanlume.com/en" },
            { "@type": "ListItem", position: 2, name: "API", item: canonical },
          ],
        }}
      />

      <section className="tool-first-home">
        <div className="container tool-first-home-inner">
          <div className="tool-first-intro">
            <p className="eyebrow scanlume-signal-label">Developer API</p>
            <h1>Scanlume OCR API</h1>
            <p>Run Simple OCR or Formatted Text OCR inside apps, automations, and internal workflows.</p>
            <p>{EN_API_INPUT_NOTE}</p>
            <div className="tool-first-pills" aria-label="API features">
              <span>Structured output</span>
              <span>Optional OCR language</span>
              <span>Base64 data URL</span>
            </div>
            <Link href="/en/pricing" className="blog-compact-link">
              View API plans
            </Link>
          </div>

          <div className="api-code-shell">
            <CodeExampleTabs examples={API_CODE_EXAMPLES} />
          </div>
        </div>
      </section>
    </div>
  );
}
