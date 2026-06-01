"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ApiKeyPanel } from "@/components/api-key-panel";
import { AuthDialog } from "@/components/auth-dialog";
import { getOrCreateBrowserId } from "@/lib/browser-id";
import { requestPasswordReset, resendVerificationEmail } from "@/lib/auth";
import { createApiKey, createBillingCheckout, fetchAccount, joinWaitlist, regenerateApiKey, revokeApiKey, type AccountResponse } from "@/lib/account";
import type { ClientLocale } from "@/lib/client-locale";
import { clearPurchaseIntent, readPurchaseIntent, savePurchaseIntent, type PurchaseIntent } from "@/lib/purchase-intent";
import { subscribeUsageRefresh } from "@/lib/usage-sync";

const PURCHASE_PRODUCTS = {
  api_starter: { label: "API Starter", kind: "api", tier: "starter" },
  api_growth: { label: "API Growth", kind: "api", tier: "growth" },
  api_scale: { label: "API Scale", kind: "api", tier: "scale" },
  web_starter_monthly: { label: "Starter mensal", kind: "web", planId: "starter" },
  web_pro_monthly: { label: "Pro mensal", kind: "web", planId: "pro" },
  web_business_monthly: { label: "Business mensal", kind: "web", planId: "business" },
  web_starter_yearly: { label: "Starter anual", kind: "web", planId: "starter" },
  web_pro_yearly: { label: "Pro anual", kind: "web", planId: "pro" },
  web_business_yearly: { label: "Business anual", kind: "web", planId: "business" },
} as const;

type PurchaseProductId = keyof typeof PURCHASE_PRODUCTS;
type AccountPlan = AccountResponse["currentPlan"];

const EN_PURCHASE_PRODUCT_LABELS: Record<PurchaseProductId, string> = {
  api_starter: "API Starter",
  api_growth: "API Growth",
  api_scale: "API Scale",
  web_starter_monthly: "Starter monthly",
  web_pro_monthly: "Pro monthly",
  web_business_monthly: "Business monthly",
  web_starter_yearly: "Starter yearly",
  web_pro_yearly: "Pro yearly",
  web_business_yearly: "Business yearly",
};

const EN_PLAN_LABELS: Record<string, { label: string; shortLabel: string; description: string; priceLabel?: string }> = {
  anonymous: {
    label: "Free trial",
    shortLabel: "Trial",
    description: "Anonymous trial with 5 credits for checking OCR before signing in.",
    priceLabel: "Free",
  },
  free: {
    label: "Free account",
    shortLabel: "Free",
    description: "Free account with 50 total credits for browser OCR.",
    priceLabel: "Free",
  },
  starter: {
    label: "Starter",
    shortLabel: "Starter",
    description: "Starter browser OCR plan for lightweight recurring work.",
  },
  pro: {
    label: "Pro",
    shortLabel: "Pro",
    description: "Pro browser OCR plan for higher monthly volume.",
  },
  business: {
    label: "Business",
    shortLabel: "Business",
    description: "Business browser OCR plan for larger batches and teams.",
  },
};

const ACCOUNT_COPY = {
  "pt-BR": {
    account: "Conta",
    myAccount: "Minha conta",
    loading: "Carregando dados da conta...",
    loadError: "Nao foi possivel carregar a conta.",
    hello: (name: string) => `Ola, ${name}`,
    signedInIntro: (plan: string, usage: string) => `Seu plano atual e ${plan}. ${usage}`,
    anonymousIntro:
      "Entre com email ou Google para transformar os 5 creditos iniciais em uma conta gratuita com 50 creditos totais.",
    signInOrCreate: "Entrar ou criar conta",
    signInToContinue: (product: string) => `Entrar para continuar com ${product}`,
    purchaseFlow: "Fluxo de compra",
    purchaseConfirmed: (product: string) => `Compra confirmada para ${product}`,
    apiPurchaseDone: "Seus API credits ja aparecem na conta. O proximo passo e gerar uma chave e testar a integracao.",
    webPurchaseDone: "Seu plano web ja esta ativo. Agora voce pode voltar ao OCR e começar a usar o saldo contratado.",
    createApiKeyNow: "Criar API key agora",
    openApiDocs: "Abrir documentacao da API",
    goToOcr: "Ir para OCR",
    continuePurchaseTitle: (product: string) => `Continue sua compra de ${product}`,
    checkoutReady: "Sua conta ja esta pronta. Reabra o checkout para concluir a compra e voltar com o saldo ativo.",
    checkoutNeedsAuth: "Entre ou crie sua conta para retomar a compra sem precisar escolher o plano de novo.",
    openingCheckout: "Abrindo checkout...",
    continuePurchase: "Continuar compra",
    backToPlans: "Voltar para planos",
    currentPlan: "Plano atual",
    creditBalance: "Saldo de creditos",
    creditsRemaining: (count: number) => `${count} creditos restantes`,
    creditsUsed: (count: number) => `${count} creditos ja foram usados desde a criacao do saldo atual.`,
    creditsGranted: (count: number) => `${count} creditos totais disponiveis neste plano.`,
    planLimits: "Limites do plano",
    planCredits: (count: number) => `${count} creditos totais`,
    costRules: "OCR simples custa 1 credito, Texto formatado custa 2 e PDF custa 2 por pagina.",
    batchLimit: (count: number) => `${count} arquivos por lote.`,
    futureBilling: "Cobranca futura",
    noBillingNote: "Sem cobranca ativa no momento.",
    replyWindowFallback: "Respondemos em ate 1 dia.",
    accountSecurity: "Seguranca da conta",
    emailConfirmed: "Email confirmado",
    emailPending: "Confirmacao pendente",
    hasPassword: "Sua conta aceita login com email e senha.",
    noPassword: "Sua conta ainda nao tem senha local. Voce pode criar uma pelo link de redefinicao.",
    providers: (providers: string) => `Provedores conectados: ${providers}`,
    noProviders: "Sem provedores externos conectados.",
    sending: "Enviando...",
    resendVerification: "Reenviar confirmacao",
    changePassword: "Trocar senha",
    setPassword: "Definir senha",
    waitlistTitle: "Versao paga de abril",
    waitlistCount: (count: number) => `${count} pessoa(s) na fila`,
    waitlistJoined: "Voce ja entrou na lista de espera. Quando a versao paga abrir, enviaremos aviso por email.",
    waitlistInvite: "Quer prioridade quando os planos pagos forem liberados? Entre na lista de espera.",
    waitlistAnonymous: "Entre com email ou Google para entrar na lista de espera e receber aviso por email quando a cobranca abrir.",
    waitlistJoinedButton: "Voce ja entrou na fila",
    joiningWaitlist: "Entrando...",
    joinWaitlist: "Entrar na lista de espera",
    loginRequired: "Login necessario para reservar seu lugar.",
    joinedAt: (date: string) => `Entrou em ${date}`,
    currentPlanStatus: "Plano atual",
    comingSoon: "Lancamento futuro",
    available: "Disponivel",
    planMetaCredits: (count: number) => `${count} creditos totais`,
    planMetaBatch: (count: number) => `${count} arquivos/lote`,
    apiPrompt: "Nome da nova API key",
    apiCreated: (secret: string) => `Nova API key criada: ${secret}`,
    apiRegenerated: (secret: string) => `API key regenerada: ${secret}`,
    checkoutError: "Nao foi possivel continuar o checkout agora.",
    waitlistError: "Nao foi possivel entrar na lista de espera.",
    alreadyVerified: "Seu email ja esta confirmado.",
    verificationSent: "Enviamos um novo link de confirmacao para seu email.",
    emailNotConfigured: "O envio de email ainda nao esta configurado neste ambiente.",
    verificationError: "Nao foi possivel reenviar o email agora.",
    resetSent: "Enviamos um link para definir ou trocar sua senha.",
    resetNotConfigured: "O fluxo de redefinicao existe, mas o envio de email ainda nao esta configurado.",
    resetError: "Nao foi possivel enviar o link agora.",
  },
  en: {
    account: "Account",
    myAccount: "My account",
    loading: "Loading account data...",
    loadError: "Could not load the account.",
    hello: (name: string) => `Hi, ${name}`,
    signedInIntro: (plan: string, usage: string) => `Your current plan is ${plan}. ${usage}`,
    anonymousIntro:
      "Sign in with email or Google to turn the 5 initial credits into a free account with 50 total credits.",
    signInOrCreate: "Sign in or create account",
    signInToContinue: (product: string) => `Sign in to continue with ${product}`,
    purchaseFlow: "Purchase flow",
    purchaseConfirmed: (product: string) => `Purchase confirmed for ${product}`,
    apiPurchaseDone: "Your API credits are now on the account. Generate a key and test the integration next.",
    webPurchaseDone: "Your web plan is active. Return to OCR and start using the purchased credit balance.",
    createApiKeyNow: "Create API key now",
    openApiDocs: "Open API documentation",
    goToOcr: "Go to OCR",
    continuePurchaseTitle: (product: string) => `Continue your ${product} purchase`,
    checkoutReady: "Your account is ready. Reopen checkout to complete the purchase and return with credits active.",
    checkoutNeedsAuth: "Sign in or create an account to resume the purchase without choosing the plan again.",
    openingCheckout: "Opening checkout...",
    continuePurchase: "Continue purchase",
    backToPlans: "Back to plans",
    currentPlan: "Current plan",
    creditBalance: "Credit balance",
    creditsRemaining: (count: number) => `${count} credits remaining`,
    creditsUsed: (count: number) => `${count} credits have been used from the current balance.`,
    creditsGranted: (count: number) => `${count} total credits are available on this plan.`,
    planLimits: "Plan limits",
    planCredits: (count: number) => `${count} total credits`,
    costRules: "Simple OCR costs 1 credit, Formatted Text costs 2 credits, and PDF costs 2 credits per page.",
    batchLimit: (count: number) => `${count} files per batch.`,
    futureBilling: "Future billing",
    noBillingNote: "No active billing right now.",
    replyWindowFallback: "We usually reply within 1 day.",
    accountSecurity: "Account security",
    emailConfirmed: "Email confirmed",
    emailPending: "Confirmation pending",
    hasPassword: "Your account can sign in with email and password.",
    noPassword: "Your account does not have a local password yet. You can create one through the reset link.",
    providers: (providers: string) => `Connected providers: ${providers}`,
    noProviders: "No external providers connected.",
    sending: "Sending...",
    resendVerification: "Resend confirmation",
    changePassword: "Change password",
    setPassword: "Set password",
    waitlistTitle: "Paid version waitlist",
    waitlistCount: (count: number) => `${count} people on the waitlist`,
    waitlistJoined: "You are already on the waitlist. We will email you when paid plans open.",
    waitlistInvite: "Want priority when paid plans open? Join the waitlist.",
    waitlistAnonymous: "Sign in with email or Google to join the waitlist and receive the launch email.",
    waitlistJoinedButton: "Already on the waitlist",
    joiningWaitlist: "Joining...",
    joinWaitlist: "Join waitlist",
    loginRequired: "Sign in is required to reserve your place.",
    joinedAt: (date: string) => `Joined on ${date}`,
    currentPlanStatus: "Current plan",
    comingSoon: "Coming soon",
    available: "Available",
    planMetaCredits: (count: number) => `${count} total credits`,
    planMetaBatch: (count: number) => `${count} files/batch`,
    apiPrompt: "New API key name",
    apiCreated: (secret: string) => `New API key created: ${secret}`,
    apiRegenerated: (secret: string) => `API key regenerated: ${secret}`,
    checkoutError: "Could not continue checkout right now.",
    waitlistError: "Could not join the waitlist.",
    alreadyVerified: "Your email is already confirmed.",
    verificationSent: "We sent a new confirmation link to your email.",
    emailNotConfigured: "Email delivery is not configured in this environment yet.",
    verificationError: "Could not resend the email right now.",
    resetSent: "We sent a link to set or change your password.",
    resetNotConfigured: "The reset flow exists, but email delivery is not configured yet.",
    resetError: "Could not send the link right now.",
  },
} as const;

function isPurchaseProductId(value: string | null): value is PurchaseProductId {
  return !!value && value in PURCHASE_PRODUCTS;
}

function hasCompletedPurchase(account: AccountResponse, product: PurchaseProductId) {
  const purchase = PURCHASE_PRODUCTS[product];

  if (purchase.kind === "api") {
    return account.api.effectiveTier === purchase.tier && account.api.remainingCredits > 0;
  }

  return account.currentPlan.id === purchase.planId && account.currentPlan.isPaid;
}

function getPurchaseProductLabel(product: PurchaseProductId, locale: ClientLocale) {
  return locale === "en" ? EN_PURCHASE_PRODUCT_LABELS[product] : PURCHASE_PRODUCTS[product].label;
}

function formatPlanLabel(plan: Pick<AccountPlan, "id" | "label">, locale: ClientLocale) {
  if (locale !== "en") {
    return plan.label;
  }

  return EN_PLAN_LABELS[plan.id]?.label ?? plan.label
    .replace(/Teste gratis/gi, "Free trial")
    .replace(/Conta gratuita/gi, "Free account")
    .replace(/mensal/gi, "monthly")
    .replace(/anual/gi, "yearly");
}

function formatPlanShortLabel(plan: Pick<AccountPlan, "id" | "shortLabel">, locale: ClientLocale) {
  if (locale !== "en") {
    return plan.shortLabel;
  }

  return EN_PLAN_LABELS[plan.id]?.shortLabel ?? plan.shortLabel
    .replace(/Teste/gi, "Trial")
    .replace(/Gratis/gi, "Free");
}

function formatPlanDescription(plan: AccountPlan, locale: ClientLocale) {
  if (locale !== "en") {
    return plan.description;
  }

  return EN_PLAN_LABELS[plan.id]?.description ?? `${formatPlanLabel(plan, locale)} plan for browser OCR.`;
}

function formatPlanPriceLabel(plan: Pick<AccountPlan, "id" | "priceLabel">, locale: ClientLocale) {
  if (locale !== "en") {
    return plan.priceLabel;
  }

  return EN_PLAN_LABELS[plan.id]?.priceLabel ?? plan.priceLabel
    .replace(/Gratis/gi, "Free")
    .replace(/mes/gi, "month")
    .replace(/ano/gi, "year");
}

function formatPlanFeatures(plan: AccountPlan, locale: ClientLocale) {
  if (locale !== "en") {
    return plan.features;
  }

  return [
    `${plan.entitlements.dailyCredits} total credits`,
    `${plan.entitlements.maxBatchFiles} files per batch`,
    `${plan.entitlements.maxImageMb} MB per image`,
  ];
}

function formatBillingStatus(status: AccountResponse["billing"]["status"], locale: ClientLocale) {
  const labels = locale === "en"
    ? {
        active: "Active subscription",
        trialing: "Trial period",
        past_due: "Payment pending",
        canceled: "Subscription canceled",
        default: "No subscription yet",
      }
    : {
        active: "Assinatura ativa",
        trialing: "Periodo de teste",
        past_due: "Pagamento pendente",
        canceled: "Assinatura cancelada",
        default: "Ainda sem assinatura",
      };

  switch (status) {
    case "active":
      return labels.active;
    case "trialing":
      return labels.trialing;
    case "past_due":
      return labels.past_due;
    case "canceled":
      return labels.canceled;
    default:
      return labels.default;
  }
}

function formatLocaleDate(value: string, locale: ClientLocale) {
  return new Date(value).toLocaleDateString(locale === "en" ? "en-US" : "pt-BR");
}

export function AccountPanel({ locale = "pt-BR" }: { locale?: ClientLocale } = {}) {
  const isEnglish = locale === "en";
  const copy = ACCOUNT_COPY[locale];
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
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
          setError(reason instanceof Error ? reason.message : copy.loadError);
        });
    };

    loadAccount();
    return subscribeUsageRefresh(loadAccount);
  }, [copy.loadError]);

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

    if (locale === "en") {
      return `${account.usage.remainingCredits}/${account.usage.grantedCredits} credits available in total`;
    }

    return `${account.usage.remainingCredits}/${account.usage.grantedCredits} creditos disponiveis no total`;
  }, [account, locale]);

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
      window.alert(copy.checkoutError);
    } finally {
      setCheckoutProduct(null);
    }
  }

  async function handleCreateApiKey() {
    const label = window.prompt(copy.apiPrompt, "build-bot");
    if (!label) {
      return;
    }

    const created = await createApiKey(label);
    window.alert(copy.apiCreated(created.secret));
    await refreshAccount();
  }

  async function handleRegenerateApiKey(id: string) {
    const regenerated = await regenerateApiKey(id);
    window.alert(copy.apiRegenerated(regenerated.secret));
    await refreshAccount();
  }

  async function handleRevokeApiKey(id: string) {
    await revokeApiKey(id);
    await refreshAccount();
  }

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
      setWaitlistError(reason instanceof Error ? reason.message : copy.waitlistError);
    } finally {
      setIsJoiningWaitlist(false);
    }
  }

  async function handleResendVerification() {
    setIsSendingVerification(true);
    setAuthActionMessage(null);

    try {
      const result = await resendVerificationEmail();
      setAuthActionMessage(
        result.alreadyVerified
          ? copy.alreadyVerified
          : result.emailDeliveryConfigured
            ? copy.verificationSent
            : copy.emailNotConfigured,
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
      setAuthActionMessage(reason instanceof Error ? reason.message : copy.verificationError);
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
          ? copy.resetSent
          : copy.resetNotConfigured,
      );
    } catch (reason) {
      setAuthActionMessage(reason instanceof Error ? reason.message : copy.resetError);
    } finally {
      setIsSendingResetLink(false);
    }
  }

  if (error) {
    return (
      <section className="account-panel-shell">
        <div className="account-hero-card">
          <p className="eyebrow">{copy.account}</p>
          <h1>{copy.myAccount}</h1>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  if (!account) {
    return (
      <section className="account-panel-shell">
        <div className="account-hero-card">
          <p className="eyebrow">{copy.account}</p>
          <h1>{copy.myAccount}</h1>
          <p>{copy.loading}</p>
        </div>
      </section>
    );
  }

  const pendingProduct = purchaseIntent && isPurchaseProductId(purchaseIntent.product) ? purchaseIntent.product : null;
  const pendingProductMeta = pendingProduct ? PURCHASE_PRODUCTS[pendingProduct] : null;
  const completedProductMeta = completedProduct ? PURCHASE_PRODUCTS[completedProduct] : null;
  const pendingProductLabel = pendingProduct ? getPurchaseProductLabel(pendingProduct, locale) : null;
  const completedProductLabel = completedProduct ? getPurchaseProductLabel(completedProduct, locale) : null;
  const currentPlanLabel = formatPlanLabel(account.currentPlan, locale);
  const accountPath = isEnglish ? "/en/account" : "/conta";
  const pricingPath = isEnglish ? "/en/pricing" : "/precos";
  const apiPath = isEnglish ? "/en/api" : "/api";
  const toolPath = isEnglish ? "/en/image-to-text" : "/imagem-para-texto";
  const authRedirectTo = pendingProduct ? `${accountPath}?flow=checkout&product=${encodeURIComponent(pendingProduct)}` : undefined;

  return (
    <section className="account-panel-shell">
      <div className="account-hero-card">
        <div>
          <p className="eyebrow">{copy.account}</p>
          <h1>{account.viewer.user?.name ? copy.hello(account.viewer.user.name.split(" ")[0]) : copy.myAccount}</h1>
        </div>
        <p>
          {account.viewer.authenticated
            ? copy.signedInIntro(currentPlanLabel, usageLabel ?? "")
            : copy.anonymousIntro}
        </p>
        {!account.viewer.authenticated && (
          <div className="hero-actions">
            <button type="button" className="solid-button" onClick={() => setIsAuthDialogOpen(true)}>
              {pendingProductLabel ? copy.signInToContinue(pendingProductLabel) : copy.signInOrCreate}
            </button>
          </div>
        )}
      </div>

      {(pendingProductMeta || completedProductMeta) && (
        <article className={`purchase-flow-card${completedProductMeta ? " is-success" : ""}`}>
          <span className="purchase-flow-kicker">{copy.purchaseFlow}</span>
          {completedProductMeta && completedProductLabel ? (
            <>
              <strong>{copy.purchaseConfirmed(completedProductLabel)}</strong>
              <p>
                {completedProductMeta.kind === "api"
                  ? copy.apiPurchaseDone
                  : copy.webPurchaseDone}
              </p>
              <div className="hero-actions">
                {completedProductMeta.kind === "api" ? (
                  <>
                    <button type="button" className="solid-button" onClick={() => void handleCreateApiKey()}>
                      {copy.createApiKeyNow}
                    </button>
                    <Link href={apiPath} className="ghost-button">{copy.openApiDocs}</Link>
                  </>
                ) : (
                  <Link href={toolPath} className="solid-button">{copy.goToOcr}</Link>
                )}
              </div>
            </>
          ) : pendingProductMeta && pendingProductLabel ? (
            <>
              <strong>{copy.continuePurchaseTitle(pendingProductLabel)}</strong>
              <p>
                {account.viewer.authenticated
                  ? copy.checkoutReady
                  : copy.checkoutNeedsAuth}
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
                    {checkoutProduct === pendingProduct ? copy.openingCheckout : copy.continuePurchase}
                  </button>
                ) : (
                  <button type="button" className="solid-button" onClick={() => setIsAuthDialogOpen(true)}>
                    {copy.signInOrCreate}
                  </button>
                )}
                <Link href={pricingPath} className="ghost-button">{copy.backToPlans}</Link>
              </div>
            </>
          ) : null}
        </article>
      )}

      <div className="account-grid">
        <article className="account-card">
          <span>{copy.currentPlan}</span>
          <strong>{currentPlanLabel}</strong>
          <p>{formatPlanDescription(account.currentPlan, locale)}</p>
          <small>{formatPlanPriceLabel(account.currentPlan, locale)}</small>
        </article>

        <article className="account-card">
          <span>{copy.creditBalance}</span>
          <strong>{copy.creditsRemaining(account.usage.remainingCredits)}</strong>
          <p>{copy.creditsUsed(account.usage.usedCredits)}</p>
          <small>{copy.creditsGranted(account.usage.grantedCredits)}</small>
        </article>

        <article className="account-card">
          <span>{copy.planLimits}</span>
          <strong>{copy.planCredits(account.currentPlan.entitlements.dailyCredits)}</strong>
          <p>{copy.costRules}</p>
          <small>{copy.batchLimit(account.currentPlan.entitlements.maxBatchFiles)}</small>
        </article>

        <article className="account-card">
          <span>{copy.futureBilling}</span>
          <strong>{formatBillingStatus(account.billing.status, locale)}</strong>
          <p>{isEnglish ? copy.noBillingNote : account.notes.subscriptions}</p>
          <small>{isEnglish ? copy.replyWindowFallback : account.notes.replyWindow}</small>
        </article>

        <ApiKeyPanel
          api={account.api}
          locale={locale}
          onCreateKey={() => void handleCreateApiKey()}
          onRegenerateKey={(id) => void handleRegenerateApiKey(id)}
          onRevokeKey={(id) => void handleRevokeApiKey(id)}
        />

        {account.viewer.authenticated && account.viewer.user && (
          <article className="account-card">
            <span>{copy.accountSecurity}</span>
            <strong>{account.viewer.user.emailVerified ? copy.emailConfirmed : copy.emailPending}</strong>
            <p>
              {account.viewer.user.hasPassword
                ? copy.hasPassword
                : copy.noPassword}
            </p>
            <small>
              {account.viewer.user.authProviders.length > 0
                ? copy.providers(account.viewer.user.authProviders.join(", "))
                : copy.noProviders}
            </small>
            <div className="hero-actions">
              {!account.viewer.user.emailVerified && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => void handleResendVerification()}
                  disabled={isSendingVerification}
                >
                  {isSendingVerification ? copy.sending : copy.resendVerification}
                </button>
              )}
              <button
                type="button"
                className="ghost-button"
                onClick={() => void handlePasswordResetLink()}
                disabled={isSendingResetLink}
              >
                {isSendingResetLink ? copy.sending : account.viewer.user.hasPassword ? copy.changePassword : copy.setPassword}
              </button>
            </div>
            {authActionMessage && <small>{authActionMessage}</small>}
          </article>
        )}

        <article className="account-card waitlist-card">
          <span>{copy.waitlistTitle}</span>
            <strong>{copy.waitlistCount(account.waitlist.count)}</strong>
            <p>
              {account.viewer.authenticated
                ? account.waitlist.joined
                  ? copy.waitlistJoined
                  : copy.waitlistInvite
                : copy.waitlistAnonymous}
            </p>
          {account.viewer.authenticated ? (
            <button
              type="button"
              className="solid-button waitlist-button"
              disabled={account.waitlist.joined || isJoiningWaitlist}
              onClick={() => void handleJoinWaitlist()}
            >
              {account.waitlist.joined ? copy.waitlistJoinedButton : isJoiningWaitlist ? copy.joiningWaitlist : copy.joinWaitlist}
            </button>
          ) : (
            <small>{copy.loginRequired}</small>
          )}
          {account.waitlist.joinedAt && <small>{copy.joinedAt(formatLocaleDate(account.waitlist.joinedAt, locale))}</small>}
          {waitlistError && <small>{waitlistError}</small>}
        </article>
      </div>

      <div className="plan-grid">
        {account.availablePlans.map((plan) => (
          <article key={plan.id} className={`plan-card${plan.isCurrent ? " is-current" : ""}`}>
            <div className="plan-card-head">
              <div>
                <span>{formatPlanShortLabel(plan, locale)}</span>
                <strong>{formatPlanLabel(plan, locale)}</strong>
              </div>
              <small>{formatPlanPriceLabel(plan, locale)}</small>
            </div>
            <p>{formatPlanDescription(plan, locale)}</p>
            <ul>
              {formatPlanFeatures(plan, locale).map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <div className="plan-card-meta">
              <span>{copy.planMetaCredits(plan.entitlements.dailyCredits)}</span>
              <span>{copy.planMetaBatch(plan.entitlements.maxBatchFiles)}</span>
            </div>
            <small>{plan.isCurrent ? copy.currentPlanStatus : plan.comingSoon ? copy.comingSoon : copy.available}</small>
          </article>
        ))}
      </div>

      <AuthDialog
        open={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        defaultMode="register"
        googleRedirectTo={authRedirectTo}
        locale={locale}
        reloadOnSuccess={false}
        onSuccess={() => void refreshAccount()}
      />
    </section>
  );
}
