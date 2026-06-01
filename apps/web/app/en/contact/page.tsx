import { SupportDesk } from "@/components/support-desk";
import { buildEnglishMetadata } from "@/lib/en-metadata";

export const metadata = buildEnglishMetadata({
  title: "Contact Scanlume",
  description: "Contact Scanlume for OCR questions, bugs, product feedback, or partnership notes.",
  keywords: ["Scanlume contact", "OCR support", "image to text support"],
  pathname: "/en/contact",
  portuguesePathname: "/contato",
});

export default function EnglishContactPage() {
  return (
    <div lang="en">
      <section className="tool-first-home">
        <div className="container contact-page-grid">
          <div className="tool-first-intro">
            <p className="eyebrow scanlume-signal-label">Contact</p>
            <h1>Tell us what happened.</h1>
            <p>
              Send OCR questions, bug reports, file examples, or product feedback. We usually reply within 1 day.
            </p>
            <div className="tool-first-pills" aria-label="Support details">
              <span>Questions</span>
              <span>Bugs</span>
              <span>Feedback</span>
            </div>
          </div>

          <SupportDesk embedded locale="en" />
        </div>
      </section>
    </div>
  );
}
