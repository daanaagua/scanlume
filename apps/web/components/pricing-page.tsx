"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  API_CODE_EXAMPLES,
  API_INPUT_NOTE,
  API_PRICING,
  BILLING_DISCLOSURES,
  CREDIT_EXPLAINER,
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

export function PricingPage() {
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
      window.alert("Nao foi possivel abrir o checkout agora.");
    } finally {
      setPendingProduct(null);
    }
  }

  const activePaidPlanId = account?.viewer.authenticated && account.currentPlan.isPaid ? account.currentPlan.id : null;

  return (
    <div className="container pricing-shell" style={{ display: "grid", gap: "2rem" }}>
      <section>
        <p className="eyebrow">Precos</p>
        <h1>Planos Web e API para Scanlume</h1>
        <p>Escolha entre uso no navegador ou integracao via API, com credits separados para cada produto e um caminho de compra mais direto.</p>
      </section>

      <section className="pricing-catalog">
        <div className="pricing-toggle" role="tablist" aria-label="Tipos de plano">
          <button type="button" className={activeCatalog === "web" ? "is-active" : ""} onClick={() => setActiveCatalog("web")}>
            Web
          </button>
          <button type="button" className={activeCatalog === "api" ? "is-active" : ""} onClick={() => setActiveCatalog("api")}>
            API
          </button>
        </div>

        {activeCatalog === "web" ? (
          <div className="pricing-stack" aria-label="Planos Web">
            {WEB_PRICING.monthly.map((plan) => {
              const isCurrentPaidPlan = activePaidPlanId === plan.id;

              return (
                <article key={plan.id} className={`pricing-offer${("recommended" in plan && plan.recommended) ? " is-recommended" : ""}`}>
                <div className="pricing-offer-head pricing-offer-head-vertical">
                  <span className="pricing-offer-kicker">{isCurrentPaidPlan ? "Plano atual" : ("recommended" in plan && plan.recommended) ? "Mais escolhido" : "Plano web"}</span>
                  <h2>{plan.name}</h2>
                  <div className="pricing-offer-price pricing-offer-price-vertical">
                    <strong>{plan.price}</strong>
                    <small>{plan.credits}</small>
                  </div>
                  <p className="pricing-offer-annual">Plano anual: {plan.annualPrice} · {plan.annualCredits}</p>
                </div>

                <div className="pricing-offer-section">
                  <span className="pricing-section-label">Included features</span>
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
                    <span>Verificando plano...</span>
                  ) : accountStatus === "error" ? (
                    <span>Nao foi possivel verificar seu plano.</span>
                  ) : isCurrentPaidPlan ? (
                    <span>Plano atual</span>
                  ) : (
                    <>
                      <button type="button" className="solid-button" onClick={() => void handleCheckout(`web_${plan.id}_monthly`)} disabled={pendingProduct === `web_${plan.id}_monthly`}>
                        {pendingProduct === `web_${plan.id}_monthly` ? "Abrindo..." : "Assinar mensal"}
                      </button>
                      <button type="button" className="ghost-button" onClick={() => void handleCheckout(`web_${plan.id}_yearly`)} disabled={pendingProduct === `web_${plan.id}_yearly`}>
                        {pendingProduct === `web_${plan.id}_yearly` ? "Abrindo..." : "Assinar anual"}
                      </button>
                    </>
                  )}
                </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="pricing-stack" aria-label="Planos API">
            {API_PRICING.map((plan) => (
              <article key={plan.id} className={`pricing-offer${("recommended" in plan && plan.recommended) ? " is-recommended" : ""}`}>
                <div className="pricing-offer-head pricing-offer-head-vertical">
                  <span className="pricing-offer-kicker">{("recommended" in plan && plan.recommended) ? "Escala recomendada" : "API credits"}</span>
                  <h2>{plan.name}</h2>
                  <div className="pricing-offer-price pricing-offer-price-vertical">
                    <strong>{plan.price}</strong>
                    <small>{plan.credits}</small>
                  </div>
                </div>

                <div className="pricing-offer-section">
                  <span className="pricing-section-label">Included features</span>
                  <ul className="pricing-feature-list">
                    <li>{plan.rpm} agregados por conta</li>
                    <li>Entrada suportada: {plan.inputs}</li>
                    <li>Ideal para automacao, uso interno e integracoes OCR</li>
                    <li>API keys por conta com saldo separado do web OCR</li>
                  </ul>
                </div>

                <div className="pricing-offer-actions">
                  <button type="button" className="solid-button" onClick={() => void handleCheckout(`api_${plan.id}`)} disabled={pendingProduct === `api_${plan.id}`}>
                    {pendingProduct === `api_${plan.id}` ? "Abrindo..." : "Comprar API pack"}
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
                <span className="pricing-section-label">Included features</span>
                <ul className="pricing-feature-list">
                  <li>Higher concurrency and custom account limits</li>
                  <li>Dedicated support and commercial alignment</li>
                  <li>Custom rollout for bulk OCR or partner workflows</li>
                </ul>
              </div>
              <div className="pricing-offer-copy">
                <p>Need more concurrency, custom limits, or dedicated support? Talk to us.</p>
              </div>
            </article>
          </div>
        )}
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
        <p>{API_INPUT_NOTE}</p>
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
