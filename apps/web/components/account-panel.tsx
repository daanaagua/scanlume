"use client";

import { useEffect, useMemo, useState } from "react";

import { getOrCreateBrowserId } from "@/lib/browser-id";
import { fetchAccount, joinWaitlist, type AccountResponse } from "@/lib/account";

export function AccountPanel() {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);

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

  async function handleJoinWaitlist() {
    setIsJoiningWaitlist(true);
    setWaitlistError(null);

    try {
      const result = await joinWaitlist();
      setAccount((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          waitlist: result.waitlist,
        };
      });
    } catch (reason) {
      setWaitlistError(reason instanceof Error ? reason.message : "Nao foi possivel entrar na lista de espera.");
    } finally {
      setIsJoiningWaitlist(false);
    }
  }

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

        <article className="account-card waitlist-card">
          <span>Versao paga de abril</span>
          <strong>{account.waitlist.count} pessoa(s) na fila</strong>
          <p>
            {account.viewer.authenticated
              ? account.waitlist.joined
                ? "Voce ja entrou na lista de espera. Quando a versao paga abrir, enviaremos aviso por email."
                : "Quer prioridade quando os planos pagos forem liberados? Entre na lista de espera."
              : "Entre com Google para entrar na lista de espera e receber aviso por email quando a cobranca abrir."}
          </p>
          {account.viewer.authenticated ? (
            <button
              type="button"
              className="solid-button waitlist-button"
              disabled={account.waitlist.joined || isJoiningWaitlist}
              onClick={() => void handleJoinWaitlist()}
            >
              {account.waitlist.joined ? "Voce ja entrou na fila" : isJoiningWaitlist ? "Entrando..." : "Entrar na lista de espera"}
            </button>
          ) : (
            <small>Login necessario para reservar seu lugar.</small>
          )}
          {account.waitlist.joinedAt && <small>Entrou em {new Date(account.waitlist.joinedAt).toLocaleDateString("pt-BR")}</small>}
          {waitlistError && <small>{waitlistError}</small>}
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
