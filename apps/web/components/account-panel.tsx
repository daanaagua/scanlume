"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ApiKeyPanel } from "@/components/api-key-panel";
import { AuthDialog } from "@/components/auth-dialog";
import { requestPasswordReset, resendVerificationEmail } from "@/lib/auth";
import { getOrCreateBrowserId } from "@/lib/browser-id";
import { createApiKey, createBillingCheckout, fetchAccount, regenerateApiKey, revokeApiKey, type AccountResponse } from "@/lib/account";
import { clearPurchaseIntent, readPurchaseIntent, savePurchaseIntent, type PurchaseIntent } from "@/lib/purchase-intent";
import { subscribeUsageRefresh } from "@/lib/usage-sync";

const PURCHASE_PRODUCTS = {
  api_starter: { label: "API Starter", kind: "api", tier: "starter" },
  api_growth: { label: "API Growth", kind: "api", tier: "growth" },
  api_scale: { label: "API Scale", kind: "api", tier: "scale" },
  web_experience_onetime: { label: "Web Experience", kind: "web_experience" },
  web_starter_monthly: { label: "Starter mensal", kind: "web", planId: "starter" },
  web_pro_monthly: { label: "Pro mensal", kind: "web", planId: "pro" },
  web_business_monthly: { label: "Business mensal", kind: "web", planId: "business" },
  web_starter_yearly: { label: "Starter anual", kind: "web", planId: "starter" },
  web_pro_yearly: { label: "Pro anual", kind: "web", planId: "pro" },
  web_business_yearly: { label: "Business anual", kind: "web", planId: "business" },
} as const;

type PurchaseProductId = keyof typeof PURCHASE_PRODUCTS;

type WebExperienceSummary = {
  title: string;
  strong: string;
  description: string;
  meta: string;
  cta: string | null;
  href: string | null;
};

function isPurchaseProductId(value: string | null): value is PurchaseProductId {
  return !!value && value in PURCHASE_PRODUCTS;
}

function hasCompletedPurchase(account: AccountResponse, product: PurchaseProductId) {
  const purchase = PURCHASE_PRODUCTS[product];

  if (purchase.kind === "api") {
    return account.api.effectiveTier === purchase.tier && account.api.remainingCredits > 0;
  }

  if (purchase.kind === "web_experience") {
    return account.webExperience.hasPurchased;
  }

  return account.currentPlan.id === purchase.planId && account.currentPlan.isPaid;
}

function formatBillingStatus(status: AccountResponse["billing"]["status"]) {
  switch (status) {
    case "active":
      return "Assinatura ativa";
    case "trialing":
      return "Periodo de teste";
    case "past_due":
      return "Pagamento pendente";
    case "canceled":
      return "Assinatura cancelada";
    default:
      return "Ainda sem assinatura";
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleDateString("pt-BR");
}

function getWebExperienceSummary(account: AccountResponse): WebExperienceSummary {
  const { webExperience } = account;
  const total = webExperience.creditsTotal ?? 1600;
  const remaining = webExperience.creditsRemaining ?? 0;
  const expiresAt = formatDate(webExperience.expiresAt);

  switch (webExperience.status) {
    case "available":
      return {
        title: "Web Experience disponivel",
        strong: "$1 - 1600 credits para um teste pago real",
        description: "Pagamentos ja estao abertos. Compre uma vez, valide o checkout e use os credits direto no OCR web.",
        meta: "Oferta unica por conta.",
        cta: "Comprar experiencia web por $1",
        href: null,
      };
    case "active":
      return {
        title: "Web Experience ativa",
        strong: `${remaining} de ${total} credits restantes`,
        description: expiresAt
          ? `Seus credits da experiencia ja estao liberados e podem ser usados ate ${expiresAt}.`
          : "Seus credits da experiencia ja estao liberados para uso imediato no OCR.",
        meta: "Oferta usada uma vez; nao ha recompra.",
        cta: null,
        href: "/imagem-para-texto",
      };
    case "consumed":
      return {
        title: "Web Experience consumida",
        strong: `Todos os ${total} credits ja foram usados`,
        description: "Voce concluiu todo o saldo da experiencia. Se precisar de mais volume, siga para um plano web regular.",
        meta: "A oferta era valida uma unica vez.",
        cta: null,
        href: "/precos",
      };
    case "expired":
      return {
        title: "Web Experience expirada",
        strong: "Sua janela da oferta terminou",
        description: expiresAt
          ? `Os credits restantes expiraram em ${expiresAt}.`
          : "Os credits restantes expiraram conforme a janela da oferta.",
        meta: "A oferta era valida uma unica vez.",
        cta: null,
        href: "/precos",
      };
    case "paid_plan_active":
      return {
        title: "Web Experience nao se aplica ao seu plano atual",
        strong: "Sua assinatura paga ja cobre o uso web",
        description: "Enquanto seu plano pago estiver ativo, a experiencia de $1 nao se aplica a esta conta.",
        meta: "Use o saldo do plano atual no OCR ou ajuste sua assinatura em /precos.",
        cta: null,
        href: "/precos",
      };
  }
}

export function AccountPanel() {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authActionMessage, setAuthActionMessage] = useState<string | null>(null);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isSendingResetLink, setIsSendingResetLink] = useState(false);
  const [purchaseIntent, setPurchaseIntent] = useState<PurchaseIntent | null>(null);
  const [completedProduct, setCompletedProduct] = useState<PurchaseProductId | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<string | null>(null);

  useEffect(() => {
    const browserId = getOrCreateBrowserId();

    const loadAccount = () => {
      void fetchAccount(browserId)
        .then((data) => {
          setAccount(data);
          setError(null);
        })
        .catch((reason) => {
          setError(reason instanceof Error ? reason.message : "Nao foi possivel carregar a conta.");
        });
    };

    loadAccount();
    return subscribeUsageRefresh(loadAccount);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flow = params.get("flow");
    const product = params.get("product");

    if (flow === "checkout" && isPurchaseProductId(product)) {
      const existingIntent = readPurchaseIntent();
      if (!existingIntent || existingIntent.product !== product) {
        savePurchaseIntent({ product, source: "pricing", stage: "auth" });
      }
      setPurchaseIntent(readPurchaseIntent());
      return;
    }

    setPurchaseIntent(readPurchaseIntent());
  }, []);

  useEffect(() => {
    if (!account || !purchaseIntent || !isPurchaseProductId(purchaseIntent.product)) {
      return;
    }

    if (account.viewer.authenticated && hasCompletedPurchase(account, purchaseIntent.product)) {
      setCompletedProduct(purchaseIntent.product);
      clearPurchaseIntent();
      setPurchaseIntent(null);
      return;
    }

    if (!account.viewer.authenticated) {
      setIsAuthDialogOpen(true);
    }
  }, [account, purchaseIntent]);

  const usageLabel = useMemo(() => {
    if (!account) {
      return null;
    }

    return `${account.usage.remainingCredits}/${account.usage.grantedCredits} creditos disponiveis no total`;
  }, [account]);

  async function refreshAccount() {
    const browserId = getOrCreateBrowserId();
    const next = await fetchAccount(browserId);
    setAccount(next);
    setError(null);
  }

  async function handleContinueCheckout(product: PurchaseProductId) {
    try {
      setCheckoutProduct(product);
      savePurchaseIntent({ product, source: "account", stage: "checkout" });
      const session = await createBillingCheckout(product);
      window.location.assign(session.checkoutUrl);
    } catch (reason) {
      if (reason instanceof Error && reason.message === "auth_required") {
        setIsAuthDialogOpen(true);
        savePurchaseIntent({ product, source: "account", stage: "auth" });
        return;
      }
      window.alert("Nao foi possivel continuar o checkout agora.");
    } finally {
      setCheckoutProduct(null);
    }
  }

  async function handleCreateApiKey() {
    const label = window.prompt("Nome da nova API key", "build-bot");
    if (!label) {
      return;
    }

    const created = await createApiKey(label);
    window.alert(`Nova API key criada: ${created.secret}`);
    await refreshAccount();
  }

  async function handleRegenerateApiKey(id: string) {
    const regenerated = await regenerateApiKey(id);
    window.alert(`API key regenerada: ${regenerated.secret}`);
    await refreshAccount();
  }

  async function handleRevokeApiKey(id: string) {
    await revokeApiKey(id);
    await refreshAccount();
  }

  async function handleResendVerification() {
    setIsSendingVerification(true);
    setAuthActionMessage(null);

    try {
      const result = await resendVerificationEmail();
      setAuthActionMessage(
        result.alreadyVerified
          ? "Seu email ja esta confirmado."
          : result.emailDeliveryConfigured
            ? "Enviamos um novo link de confirmacao para seu email."
            : "O envio de email ainda nao esta configurado neste ambiente.",
      );

      const verifiedUser = result.user;
      if (verifiedUser) {
        setAccount((current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            viewer: {
              ...current.viewer,
              user: verifiedUser,
            },
          };
        });
      }
    } catch (reason) {
      setAuthActionMessage(reason instanceof Error ? reason.message : "Nao foi possivel reenviar o email agora.");
    } finally {
      setIsSendingVerification(false);
    }
  }

  async function handlePasswordResetLink() {
    if (!account?.viewer.user?.email) {
      return;
    }

    setIsSendingResetLink(true);
    setAuthActionMessage(null);

    try {
      const result = await requestPasswordReset({ email: account.viewer.user.email });
      setAuthActionMessage(
        result.emailDeliveryConfigured
          ? "Enviamos um link para definir ou trocar sua senha."
          : "O fluxo de redefinicao existe, mas o envio de email ainda nao esta configurado.",
      );
    } catch (reason) {
      setAuthActionMessage(reason instanceof Error ? reason.message : "Nao foi possivel enviar o link agora.");
    } finally {
      setIsSendingResetLink(false);
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

  const pendingProduct = purchaseIntent && isPurchaseProductId(purchaseIntent.product) ? purchaseIntent.product : null;
  const pendingProductMeta = pendingProduct ? PURCHASE_PRODUCTS[pendingProduct] : null;
  const completedProductMeta = completedProduct ? PURCHASE_PRODUCTS[completedProduct] : null;
  const authRedirectTo = pendingProduct ? `/conta?flow=checkout&product=${encodeURIComponent(pendingProduct)}` : undefined;
  const webExperienceSummary = getWebExperienceSummary(account);

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
            : "Entre com email ou Google para transformar os 5 creditos iniciais em uma conta gratuita com 50 creditos totais."}
        </p>
        {!account.viewer.authenticated && (
          <div className="hero-actions">
            <button type="button" className="solid-button" onClick={() => setIsAuthDialogOpen(true)}>
              {pendingProductMeta ? `Entrar para continuar com ${pendingProductMeta.label}` : "Entrar ou criar conta"}
            </button>
          </div>
        )}
      </div>

      {(pendingProductMeta || completedProductMeta) && (
        <article className={`purchase-flow-card${completedProductMeta ? " is-success" : ""}`}>
          <span className="purchase-flow-kicker">Fluxo de compra</span>
          {completedProductMeta ? (
            <>
              <strong>{`Compra confirmada para ${completedProductMeta.label}`}</strong>
              <p>
                {completedProductMeta.kind === "api"
                  ? "Seus API credits ja aparecem na conta. O proximo passo e gerar uma chave e testar a integracao."
                  : completedProductMeta.kind === "web_experience"
                    ? "Seus 1600 credits ja estao disponiveis. Agora voce pode voltar ao OCR web e validar o fluxo completo."
                    : "Seu plano web ja esta ativo. Agora voce pode voltar ao OCR e comecar a usar o saldo contratado."}
              </p>
              <div className="hero-actions">
                {completedProductMeta.kind === "api" ? (
                  <>
                    <button type="button" className="solid-button" onClick={() => void handleCreateApiKey()}>
                      Criar API key agora
                    </button>
                    <Link href="/api" className="ghost-button">Abrir documentacao da API</Link>
                  </>
                ) : completedProductMeta.kind === "web_experience" ? (
                  <Link href="/imagem-para-texto" className="solid-button">Abrir OCR agora</Link>
                ) : (
                  <Link href="/imagem-para-texto" className="solid-button">Ir para OCR</Link>
                )}
              </div>
            </>
          ) : pendingProductMeta ? (
            <>
              <strong>{`Continue sua compra de ${pendingProductMeta.label}`}</strong>
              <p>
                {account.viewer.authenticated
                  ? "Sua conta ja esta pronta. Reabra o checkout para concluir a compra e voltar com o saldo ativo."
                  : "Entre ou crie sua conta para retomar a compra sem precisar escolher o plano de novo."}
              </p>
              <div className="hero-actions">
                {account.viewer.authenticated ? (
                  <button
                    type="button"
                    className="solid-button"
                    onClick={() => {
                      if (pendingProduct) {
                        void handleContinueCheckout(pendingProduct);
                      }
                    }}
                    disabled={checkoutProduct === pendingProduct}
                  >
                    {checkoutProduct === pendingProduct ? "Abrindo checkout..." : "Continuar compra"}
                  </button>
                ) : (
                  <button type="button" className="solid-button" onClick={() => setIsAuthDialogOpen(true)}>
                    Entrar ou criar conta
                  </button>
                )}
                <Link href="/precos" className="ghost-button">Voltar para planos</Link>
              </div>
            </>
          ) : null}
        </article>
      )}

      <div className="account-grid">
        <article className="account-card">
          <span>Plano atual</span>
          <strong>{account.currentPlan.label}</strong>
          <p>{account.currentPlan.description}</p>
          <small>{account.currentPlan.priceLabel}</small>
        </article>

        <article className="account-card">
          <span>Saldo de creditos</span>
          <strong>{account.usage.remainingCredits} creditos restantes</strong>
          <p>{account.usage.usedCredits} creditos ja foram usados desde a criacao do saldo atual.</p>
          <small>{account.usage.grantedCredits} creditos totais disponiveis neste plano.</small>
        </article>

        <article className="account-card">
          <span>Limites do plano</span>
          <strong>{account.currentPlan.entitlements.dailyCredits} creditos totais</strong>
          <p>OCR simples custa 1 credito, Texto formatado custa 2 e PDF custa 2 por pagina.</p>
          <small>{account.currentPlan.entitlements.maxBatchFiles} arquivos por lote.</small>
        </article>

        <article className="account-card">
          <span>Cobranca futura</span>
          <strong>{formatBillingStatus(account.billing.status)}</strong>
          <p>{account.notes.subscriptions}</p>
          <small>{account.notes.replyWindow}</small>
        </article>

        <article className="account-card">
          <span>{webExperienceSummary.title}</span>
          <strong>{webExperienceSummary.strong}</strong>
          <p>{webExperienceSummary.description}</p>
          <small>{webExperienceSummary.meta}</small>
          <div className="hero-actions">
            {webExperienceSummary.cta ? (
              <button
                type="button"
                className="solid-button"
                onClick={() => void handleContinueCheckout("web_experience_onetime")}
                disabled={checkoutProduct === "web_experience_onetime"}
              >
                {checkoutProduct === "web_experience_onetime" ? "Abrindo checkout..." : webExperienceSummary.cta}
              </button>
            ) : webExperienceSummary.href ? (
              <Link href={webExperienceSummary.href} className="ghost-button">
                {account.webExperience.status === "active" ? "Ir para OCR" : "Ver planos"}
              </Link>
            ) : null}
          </div>
        </article>

        <ApiKeyPanel
          api={account.api}
          onCreateKey={() => void handleCreateApiKey()}
          onRegenerateKey={(id) => void handleRegenerateApiKey(id)}
          onRevokeKey={(id) => void handleRevokeApiKey(id)}
        />

        {account.viewer.authenticated && account.viewer.user && (
          <article className="account-card">
            <span>Seguranca da conta</span>
            <strong>{account.viewer.user.emailVerified ? "Email confirmado" : "Confirmacao pendente"}</strong>
            <p>
              {account.viewer.user.hasPassword
                ? "Sua conta aceita login com email e senha."
                : "Sua conta ainda nao tem senha local. Voce pode criar uma pelo link de redefinicao."}
            </p>
            <small>
              {account.viewer.user.authProviders.length > 0
                ? `Provedores conectados: ${account.viewer.user.authProviders.join(", ")}`
                : "Sem provedores externos conectados."}
            </small>
            <div className="hero-actions">
              {!account.viewer.user.emailVerified && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => void handleResendVerification()}
                  disabled={isSendingVerification}
                >
                  {isSendingVerification ? "Enviando..." : "Reenviar confirmacao"}
                </button>
              )}
              <button
                type="button"
                className="ghost-button"
                onClick={() => void handlePasswordResetLink()}
                disabled={isSendingResetLink}
              >
                {isSendingResetLink ? "Enviando..." : account.viewer.user.hasPassword ? "Trocar senha" : "Definir senha"}
              </button>
            </div>
            {authActionMessage && <small>{authActionMessage}</small>}
          </article>
        )}
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
              <span>{plan.entitlements.dailyCredits} creditos totais</span>
              <span>{plan.entitlements.maxBatchFiles} arquivos/lote</span>
            </div>
            <small>{plan.isCurrent ? "Plano atual" : plan.comingSoon ? "Lancamento futuro" : "Disponivel"}</small>
          </article>
        ))}
      </div>

      <AuthDialog
        open={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        defaultMode="register"
        googleRedirectTo={authRedirectTo}
        reloadOnSuccess={false}
        onSuccess={() => void refreshAccount()}
      />
    </section>
  );
}
