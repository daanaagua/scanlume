import { buildEnglishMetadata } from "@/lib/en-metadata";

export const metadata = buildEnglishMetadata({
  title: "Scanlume privacy",
  description: "How Scanlume handles uploaded files, browser identifiers, usage limits, and operational logs.",
  keywords: ["Scanlume privacy", "OCR privacy", "image OCR data"],
  pathname: "/en/privacy",
  portuguesePathname: "/privacidade",
});

export default function EnglishPrivacyPage() {
  return (
    <div lang="en">
      <section className="tool-first-home">
        <div className="container">
          <div className="tool-first-intro">
            <p className="eyebrow scanlume-signal-label">Privacy</p>
            <h1>Minimal processing for OCR jobs.</h1>
            <p>
              Scanlume processes uploaded files to generate OCR output and keeps only the operational data needed to run limits, prevent abuse, and support the service.
            </p>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="container legal-copy">
          <p>
            Uploaded images and PDFs are processed to produce text extraction results. Operational logs may include browser id, usage mode, cost estimates, request status, and abuse-prevention signals.
          </p>
          <p>
            Uploaded files are not used to train Scanlume-owned models. Persistent storage is limited to product flows that explicitly need it, such as future batch or account features.
          </p>
          <p>
            If a support request includes an example file or OCR result, we use that information only to understand the issue and reply to the user.
          </p>
        </div>
      </section>
    </div>
  );
}
