"use client";

import { useEffect, useState } from "react";

import {
  API_CODE_EXAMPLES,
  API_INPUT_NOTE,
  API_PRICING,
  BILLING_DISCLOSURES,
  CREDIT_EXPLAINER,
  EN_API_INPUT_NOTE,
  EN_API_PRICING,
  EN_BILLING_DISCLOSURES,
  EN_CREDIT_EXPLAINER,
  EN_WEB_PRICING,
  WEB_PRICING,
} from "@/lib/pricing";
import { CodeExampleTabs } from "@/components/code-example-tabs";
import { getOrCreateBrowserId } from "@/lib/browser-id";
import { createBillingCheckout, fetchAccount, type AccountResponse } from "@/lib/account";
import { savePurchaseIntent } from "@/lib/purchase-intent";

function splitUsage(value: string) {
  return value.split("/").map((item) => item.trim()).filter(Boolean);
}

function splitLimits(value: string) {
  return value.split("-").map((item) => item.trim()).filter(Boolean);
}

type PricingLocale = "pt-BR" | "en";

const PRICING_COPY = {
  "pt-BR": {
    eyebrow: "Precos",
    h1: "Planos Simples",
    lead: "Escolha entre o uso direto no navegador ou integracao automatizada via API.",
    tabAria: "Tipos de plano",
    webPlansAria: "Planos Web",
    apiPlansAria: "Planos API",
    currentPlan: "Plano atual",
    recommended: "Mais escolhido",
    webPlan: "Plano web",
    annualPrefix: "Plano anual",
    features: "Recursos incluidos",
    checking: "Verificando plano...",
    accountError: "Nao foi possivel verificar seu plano.",
    monthlyCta: "Assinar mensal",
    annualCta: "Assinar anual",
    opening: "Abrindo...",
    apiRecommended: "Escala recomendada",
    apiCredits: "API credits",
    apiCta: "Comprar API pack",
    includedRpmSuffix: "agregados",
    inputPrefix: "Entrada:",
    apiIntegration: "Integracao OCR",
    customLimits: "Limites sob medida",
    dedicatedSupport: "Suporte dedicado",
    batchOcr: "OCR em lote",
    creditsHeading: "Como os credits funcionam",
    billingHeading: "Regras de cobranca",
    apiHeading: "Exemplos da API de OCR para imagem",
    checkoutError: "Nao foi possivel abrir o checkout agora.",
  },
  en: {
    eyebrow: "Pricing",
    h1: "Simple plans",
    lead: "Choose browser-based OCR or automated API integration.",
    tabAria: "Plan types",
    webPlansAria: "Web plans",
    apiPlansAria: "API plans",
    currentPlan: "Current plan",
    recommended: "Most selected",
    webPlan: "Web plan",
    annualPrefix: "Annual plan",
    features: "Included features",
    checking: "Checking plan...",
    accountError: "Could not verify your plan.",
    monthlyCta: "Subscribe monthly",
    annualCta: "Subscribe yearly",
    opening: "Opening...",
    apiRecommended: "Recommended scale",
    apiCredits: "API credits",
    apiCta: "Buy API pack",
    includedRpmSuffix: "included",
    inputPrefix: "Input:",
    apiIntegration: "OCR integration",
    customLimits: "Custom limits",
    dedicatedSupport: "Dedicated support",
    batchOcr: "Batch OCR",
    creditsHeading: "How credits work",
    billingHeading: "Billing rules",
    apiHeading: "Image OCR API examples",
    checkoutError: "Could not open checkout right now.",
  },
} as const;

export function PricingPage({ locale = "pt-BR" }: { locale?: PricingLocale }) {
  const [activeCatalog, setActiveCatalog] = useState<"web" | "api">("web");
  const [pendingProduct, setPendingProduct] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [accountStatus, setAccountStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    let isActive = true;

    void fetchAccount(getOrCreateBrowserId())
      .then((data) => {
        if (isActive) {
          setAccount(data);
          setAccountStatus("loaded");
        }
      })
      .catch(() => {
        if (isActive) {
          setAccount(null);
          setAccountStatus("error");
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function handleCheckout(product: string) {
    try {
      setPendingProduct(product);
      const session = await createBillingCheckout(product);
      savePurchaseIntent({ product, source: "pricing", stage: "checkout" });
      window.location.assign(session.checkoutUrl);
    } catch (error) {
      if (error instanceof Error && error.message === "auth_required") {
        savePurchaseIntent({ product, source: "pricing", stage: "auth" });
        window.location.assign(`/conta?flow=checkout&product=${encodeURIComponent(product)}`);
        return;
      }
      window.alert(copy.checkoutError);
    } finally {
      setPendingProduct(null);
    }
  }

  const copy = PRICING_COPY[locale];
  const webPricing = locale === "en" ? EN_WEB_PRICING : WEB_PRICING;
  const apiPricing = locale === "en" ? EN_API_PRICING : API_PRICING;
  const creditExplainer = locale === "en" ? EN_CREDIT_EXPLAINER : CREDIT_EXPLAINER;
  const billingDisclosures = locale === "en" ? EN_BILLING_DISCLOSURES : BILLING_DISCLOSURES;
  const apiInputNote = locale === "en" ? EN_API_INPUT_NOTE : API_INPUT_NOTE;
  const activePaidPlanId = account?.viewer.authenticated && account.currentPlan.isPaid ? account.currentPlan.id : null;

  return (
    <div className="container pricing-shell">
      <section className="tool-first-intro">
        <p className="eyebrow scanlume-signal-label">{copy.eyebrow}</p>
        <h1>{copy.h1}</h1>
        <p>{copy.lead}</p>
      </section>

      <section className="pricing-catalog">
        <div className="pricing-toggle" role="tablist" aria-label={copy.tabAria}>
          <button type="button" className={activeCatalog === "web" ? "is-active" : ""} onClick={() => setActiveCatalog("web")}>
            Web
          </button>
          <button type="button" className={activeCatalog === "api" ? "is-active" : ""} onClick={() => setActiveCatalog("api")}>
            API
          </button>
        </div>

        {activeCatalog === "web" ? (
          <div className="pricing-stack" aria-label={copy.webPlansAria}>
            {webPricing.monthly.map((plan) => {
              const isCurrentPaidPlan = activePaidPlanId === plan.id;

              return (
                <article key={plan.id} className={`pricing-offer${("recommended" in plan && plan.recommended) ? " is-recommended" : ""}`}>
                  <div className="pricing-offer-head pricing-offer-head-vertical">
                    <span className="pricing-offer-kicker">{isCurrentPaidPlan ? copy.currentPlan : ("recommended" in plan && plan.recommended) ? copy.recommended : copy.webPlan}</span>
                    <h2>{plan.name}</h2>
                    <div className="pricing-offer-price pricing-offer-price-vertical">
                      <strong>{plan.price}</strong>
                      <small>{plan.credits}</small>
                    </div>
                    <p className="pricing-offer-annual">{copy.annualPrefix}: {plan.annualPrice} · {plan.annualCredits}</p>
                  </div>

                  <div className="pricing-offer-section">
                    <span className="pricing-section-label">{copy.features}</span>
                    <ul className="pricing-feature-list">
                      {splitUsage(plan.usage).map((item) => (
                        <li key={`${plan.id}-${item}`}>{item}</li>
                      ))}
                      {splitLimits(plan.limits).map((item) => (
                        <li key={`${plan.id}-limit-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pricing-offer-actions">
                    {accountStatus === "loading" ? (
                      <span>{copy.checking}</span>
                    ) : accountStatus === "error" ? (
                      <span>{copy.accountError}</span>
                    ) : isCurrentPaidPlan ? (
                      <span>{copy.currentPlan}</span>
                    ) : (
                      <>
                        <button type="button" className="solid-button" onClick={() => void handleCheckout(`web_${plan.id}_monthly`)} disabled={pendingProduct === `web_${plan.id}_monthly`}>
                          {pendingProduct === `web_${plan.id}_monthly` ? copy.opening : copy.monthlyCta}
                        </button>
                        <button type="button" className="ghost-button" onClick={() => void handleCheckout(`web_${plan.id}_yearly`)} disabled={pendingProduct === `web_${plan.id}_yearly`}>
                          {pendingProduct === `web_${plan.id}_yearly` ? copy.opening : copy.annualCta}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="pricing-stack" aria-label={copy.apiPlansAria}>
            {apiPricing.map((plan) => (
              <article key={plan.id} className={`pricing-offer${("recommended" in plan && plan.recommended) ? " is-recommended" : ""}`}>
                <div className="pricing-offer-head pricing-offer-head-vertical">
                  <span className="pricing-offer-kicker">{("recommended" in plan && plan.recommended) ? copy.apiRecommended : copy.apiCredits}</span>
                  <h2>{plan.name}</h2>
                  <div className="pricing-offer-price pricing-offer-price-vertical">
                    <strong>{plan.price}</strong>
                    <small>{plan.credits}</small>
                  </div>
                </div>

                <div className="pricing-offer-section">
                  <span className="pricing-section-label">{copy.features}</span>
                  <ul className="pricing-feature-list">
                    <li>{plan.rpm} {copy.includedRpmSuffix}</li>
                    <li>{copy.inputPrefix} {plan.inputs}</li>
                    <li>{copy.apiIntegration}</li>
                  </ul>
                </div>

                <div className="pricing-offer-actions">
                  <button type="button" className="solid-button" onClick={() => void handleCheckout(`api_${plan.id}`)} disabled={pendingProduct === `api_${plan.id}`}>
                    {pendingProduct === `api_${plan.id}` ? copy.opening : copy.apiCta}
                  </button>
                </div>
              </article>
            ))}

            <article className="pricing-offer pricing-offer-compact">
              <div className="pricing-offer-head pricing-offer-head-vertical">
                <span className="pricing-offer-kicker">Enterprise</span>
                <h2>Custom</h2>
              </div>
              <div className="pricing-offer-section">
                <span className="pricing-section-label">{copy.features}</span>
                <ul className="pricing-feature-list">
                  <li>{copy.customLimits}</li>
                  <li>{copy.dedicatedSupport}</li>
                  <li>{copy.batchOcr}</li>
                </ul>
              </div>
            </article>
          </div>
        )}
      </section>

      <section className="pricing-rules-section">
        <div className="pricing-rules-card">
          <h2>{copy.creditsHeading}</h2>
          <div className="hero-bullets">
            {creditExplainer.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="pricing-rules-card">
          <h2>{copy.billingHeading}</h2>
          <div className="hero-bullets">
            {billingDisclosures.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="pricing-api-section">
        <h2>{copy.apiHeading}</h2>
        <p>{apiInputNote}</p>
        <CodeExampleTabs examples={API_CODE_EXAMPLES} />
      </section>
    </div>
  );
}
