"use client";

import Link from "next/link";
import { useState } from "react";

import {
  API_CODE_EXAMPLES,
  API_PRICING,
  BILLING_DISCLOSURES,
  CREDIT_EXPLAINER,
  WEB_PRICING,
} from "@/lib/pricing";
import { CodeExampleTabs } from "@/components/code-example-tabs";
import { createBillingCheckout } from "@/lib/account";

export function PricingPage() {
  const [pendingProduct, setPendingProduct] = useState<string | null>(null);

  async function handleCheckout(product: string) {
    try {
      setPendingProduct(product);
      const session = await createBillingCheckout(product);
      window.location.href = session.checkoutUrl;
    } catch (error) {
      if (error instanceof Error && error.message === "auth_required") {
        window.location.href = "/conta";
        return;
      }
      window.alert("Nao foi possivel abrir o checkout agora.");
    } finally {
      setPendingProduct(null);
    }
  }

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
              <span>{("recommended" in plan && plan.recommended) ? "Recommended" : "Web plan"}</span>
              <strong>{plan.name}</strong>
              <p>{plan.price}</p>
              <p>{plan.credits}</p>
              <p>{plan.annualPrice}</p>
              <p>{plan.annualCredits}</p>
              <p>{plan.usage}</p>
              <p>{plan.limits}</p>
              <div className="hero-actions">
                <button type="button" className="solid-button" onClick={() => void handleCheckout(`web_${plan.id}_monthly`)} disabled={pendingProduct === `web_${plan.id}_monthly`}>
                  {pendingProduct === `web_${plan.id}_monthly` ? "Abrindo..." : "Assinar mensal"}
                </button>
                <button type="button" className="ghost-button" onClick={() => void handleCheckout(`web_${plan.id}_yearly`)} disabled={pendingProduct === `web_${plan.id}_yearly`}>
                  {pendingProduct === `web_${plan.id}_yearly` ? "Abrindo..." : "Assinar anual"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>API plans</h2>
        <div className="related-grid">
          {API_PRICING.map((plan) => (
            <article key={plan.id} className="related-card">
              <span>{("recommended" in plan && plan.recommended) ? "Recommended" : "API pack"}</span>
              <strong>{plan.name}</strong>
              <p>{plan.price}</p>
              <p>{plan.credits}</p>
              <p>{plan.rpm}</p>
              <p>{plan.inputs}</p>
              <div className="hero-actions">
                <button type="button" className="solid-button" onClick={() => void handleCheckout(`api_${plan.id}`)} disabled={pendingProduct === `api_${plan.id}`}>
                  {pendingProduct === `api_${plan.id}` ? "Abrindo..." : "Comprar API pack"}
                </button>
              </div>
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
        <p>PDF OCR API ainda nao esta aberto ao publico. Vamos liberar o beta em uma fase seguinte, depois que a execucao assincrona estiver pronta para uso real.</p>
        <div className="hero-actions">
          <Link href="/contato" className="ghost-button">Entrar na lista do beta</Link>
        </div>
      </section>

      <section>
        <Link href="/api">Open developer page</Link>
      </section>
    </div>
  );
}
