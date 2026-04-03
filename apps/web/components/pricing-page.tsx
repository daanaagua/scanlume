import Link from "next/link";

import {
  API_CODE_EXAMPLES,
  API_PRICING,
  BILLING_DISCLOSURES,
  CREDIT_EXPLAINER,
  WEB_PRICING,
} from "../../api/src/lib/api-docs";
import { CodeExampleTabs } from "@/components/code-example-tabs";

export function PricingPage() {
  return (
    <div className="container" style={{ display: "grid", gap: "2rem" }}>
      <section>
        <p className="eyebrow">Precos</p>
        <h1>Planos Web e API para Scanlume</h1>
        <p>Escolha entre uso no navegador ou integracao via API, com credits separados para cada produto.</p>
      </section>

      <section>
        <h2>Web plans</h2>
        <div className="related-grid">
          {WEB_PRICING.monthly.map((plan) => (
            <article key={plan.id} className="related-card">
              <span>{plan.recommended ? "Recommended" : "Web plan"}</span>
              <strong>{plan.name}</strong>
              <p>{plan.price}</p>
              <p>{plan.credits}</p>
              <p>{plan.annualPrice}</p>
              <p>{plan.annualCredits}</p>
              <p>{plan.usage}</p>
              <p>{plan.limits}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>API plans</h2>
        <div className="related-grid">
          {API_PRICING.map((plan) => (
            <article key={plan.id} className="related-card">
              <span>{plan.recommended ? "Recommended" : "API pack"}</span>
              <strong>{plan.name}</strong>
              <p>{plan.price}</p>
              <p>{plan.credits}</p>
              <p>{plan.rpm}</p>
              <p>{plan.inputs}</p>
            </article>
          ))}
          <article className="related-card">
            <span>Enterprise</span>
            <strong>Custom</strong>
            <p>Need more concurrency, custom limits, or dedicated support? Talk to us.</p>
          </article>
        </div>
      </section>

      <section>
        <h2>How credits work</h2>
        <div className="hero-bullets">
          {CREDIT_EXPLAINER.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section>
        <h2>Billing rules</h2>
        <div className="hero-bullets">
          {BILLING_DISCLOSURES.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section>
        <h2>Image OCR API examples</h2>
        <CodeExampleTabs examples={API_CODE_EXAMPLES} />
      </section>

      <section>
        <h2>PDF OCR API Beta</h2>
        <p>PDF OCR API is currently in beta and uses async jobs.</p>
        <pre>
          <code>{`curl -X POST "https://api.scanlume.com/v1/api/pdf/jobs" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"fileName":"sample.pdf","totalPages":3}'`}</code>
        </pre>
      </section>

      <section>
        <Link href="/api">Open developer page</Link>
      </section>
    </div>
  );
}
