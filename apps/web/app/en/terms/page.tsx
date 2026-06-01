import { buildEnglishMetadata } from "@/lib/en-metadata";

export const metadata = buildEnglishMetadata({
  title: "Scanlume terms",
  description: "Fair-use terms for Scanlume online OCR, anonymous credits, file limits, and API access.",
  keywords: ["Scanlume terms", "OCR terms", "OCR fair use"],
  pathname: "/en/terms",
  portuguesePathname: "/termos",
});

export default function EnglishTermsPage() {
  return (
    <div lang="en">
      <section className="tool-first-home">
        <div className="container">
          <div className="tool-first-intro">
            <p className="eyebrow scanlume-signal-label">Terms</p>
            <h1>Fair use keeps OCR fast and available.</h1>
            <p>
              Scanlume offers browser OCR, free trial credits, paid web plans, and API packs under usage limits designed to keep the service stable.
            </p>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container legal-copy">
          <p>
            Anonymous access is intended for testing the product before signing in. Users are subject to file size, batch, credit, and abuse-prevention limits.
          </p>
          <p>
            Scanlume may block requests that indicate abusive automation, attempts to bypass limits, or traffic that threatens service reliability.
          </p>
          <p>
            Web credits and API credits are separate balances. Plan limits, export formats, and API features may evolve as the product changes.
          </p>
        </div>
      </section>
    </div>
  );
}
