"use client";

import { useEffect, useMemo, useState } from "react";

import { getOrCreateBrowserId } from "@/lib/browser-id";
import { fetchAccount, type AccountResponse } from "@/lib/account";

export function AccountPanel() {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const browserId = getOrCreateBrowserId();
    void fetchAccount(browserId)
      .then((data) => {
        setAccount(data);
        setError(null);
      })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Nao foi possivel carregar a conta.");
      });
  }, []);

  const usageLabel = useMemo(() => {
    if (!account) {
      return null;
    }

    return `${account.usageToday.remainingCredits}/${account.currentPlan.entitlements.dailyCredits} creditos disponiveis hoje`;
  }, [account]);

  if (error) {
    return (
      <section className="account-panel-shell">
        <div className="account-hero-card">
          <p className="eyebrow">Conta</p>
          <h1>Minha conta</h1>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  if (!account) {
    return (
      <section className="account-panel-shell">
        <div className="account-hero-card">
          <p className="eyebrow">Conta</p>
          <h1>Minha conta</h1>
          <p>Carregando dados da conta...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="account-panel-shell">
      <div className="account-hero-card">
        <div>
          <p className="eyebrow">Conta</p>
          <h1>{account.viewer.user?.name ? `Ola, ${account.viewer.user.name.split(" ")[0]}` : "Minha conta"}</h1>
        </div>
        <p>
          {account.viewer.authenticated
            ? `Seu plano atual e ${account.currentPlan.label}. ${usageLabel ?? ""}`
            : "Entre com Google para transformar o uso atual em uma conta permanente do Scanlume."}
        </p>
      </div>

      <div className="account-grid">
        <article className="account-card">
          <span>Plano atual</span>
          <strong>{account.currentPlan.label}</strong>
          <p>{account.currentPlan.description}</p>
          <small>{account.currentPlan.priceLabel}</small>
        </article>

        <article className="account-card">
          <span>Uso de hoje</span>
          <strong>{account.usageToday.usedCredits} creditos usados</strong>
          <p>{account.usageToday.remainingCredits} creditos ainda disponiveis hoje.</p>
          <small>{account.usageToday.usedImages} imagem(ns) processada(s).</small>
        </article>

        <article className="account-card">
          <span>Limites do plano</span>
          <strong>{account.currentPlan.entitlements.dailyCredits} creditos / dia</strong>
          <p>{account.currentPlan.entitlements.dailyImages} imagens por dia.</p>
          <small>{account.currentPlan.entitlements.maxBatchFiles} arquivos por lote.</small>
        </article>

        <article className="account-card">
          <span>Cobranca futura</span>
          <strong>{account.billing.status === "inactive" ? "Ainda sem assinatura" : account.billing.status}</strong>
          <p>{account.notes.subscriptions}</p>
          <small>{account.notes.replyWindow}</small>
        </article>
      </div>

      <div className="plan-grid">
        {account.availablePlans.map((plan) => (
          <article key={plan.id} className={`plan-card${plan.isCurrent ? " is-current" : ""}`}>
            <div className="plan-card-head">
              <div>
                <span>{plan.shortLabel}</span>
                <strong>{plan.label}</strong>
              </div>
              <small>{plan.priceLabel}</small>
            </div>
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <div className="plan-card-meta">
              <span>{plan.entitlements.dailyCredits} creditos/dia</span>
              <span>{plan.entitlements.maxBatchFiles} arquivos/lote</span>
            </div>
            <small>{plan.isCurrent ? "Plano atual" : plan.comingSoon ? "Lancamento futuro" : "Disponivel"}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
