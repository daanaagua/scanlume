import { grantApiPack } from "./api-usage";
import { writeBillingPurchase, type BillingPurchaseKind, type WorkerEnv } from "./store";
import { grantWebSubscriptionTerm } from "./web-subscriptions";

type BillingProductId =
  | "web_starter_monthly"
  | "web_pro_monthly"
  | "web_business_monthly"
  | "web_starter_yearly"
  | "web_pro_yearly"
  | "web_business_yearly"
  | "api_starter"
  | "api_growth"
  | "api_scale";

type BillingWebhookEvent = {
  id: string;
  provider: string;
  type: string;
  userId: string;
  productId: BillingProductId;
  sessionId: string;
  occurredAt: string;
  billingEmail?: string | null;
};

type CheckoutSessionInput = {
  userId: string;
  product: BillingProductId;
};

type ProductConfig = {
  kind: BillingPurchaseKind;
  planId?: string;
  billingInterval?: "month" | "year";
  creditsTotal?: number;
  tier?: "starter" | "growth" | "scale";
  durationDays?: number;
};

const BILLING_PRODUCT_CONFIG: Record<BillingProductId, ProductConfig> = {
  web_starter_monthly: { kind: "web_subscription", planId: "starter", billingInterval: "month", creditsTotal: 8000, durationDays: 30 },
  web_pro_monthly: { kind: "web_subscription", planId: "pro", billingInterval: "month", creditsTotal: 24000, durationDays: 30 },
  web_business_monthly: { kind: "web_subscription", planId: "business", billingInterval: "month", creditsTotal: 60000, durationDays: 30 },
  web_starter_yearly: { kind: "web_subscription", planId: "starter", billingInterval: "year", creditsTotal: 100000, durationDays: 365 },
  web_pro_yearly: { kind: "web_subscription", planId: "pro", billingInterval: "year", creditsTotal: 240000, durationDays: 365 },
  web_business_yearly: { kind: "web_subscription", planId: "business", billingInterval: "year", creditsTotal: 800000, durationDays: 365 },
  api_starter: { kind: "api_pack", tier: "starter", creditsTotal: 10000 },
  api_growth: { kind: "api_pack", tier: "growth", creditsTotal: 40000 },
  api_scale: { kind: "api_pack", tier: "scale", creditsTotal: 140000 },
};

export async function createCheckoutSession(
  env: WorkerEnv,
  input: CheckoutSessionInput,
  deps?: {
    createCheckout?: (args: { provider: string; product: BillingProductId; userId: string }) => Promise<{ checkoutUrl: string }>;
  },
) {
  const provider = env.BILLING_PROVIDER ?? "mock";
  const checkout = deps?.createCheckout
    ? await deps.createCheckout({ provider, product: input.product, userId: input.userId })
    : { checkoutUrl: `https://checkout.${provider}.test/${input.product}?user=${encodeURIComponent(input.userId)}` };

  return {
    checkoutUrl: checkout.checkoutUrl,
    product: input.product,
  };
}

export async function handleBillingWebhook(env: WorkerEnv, event: BillingWebhookEvent) {
  const product = BILLING_PRODUCT_CONFIG[event.productId];
  const purchaseId = `${event.provider}:${event.id}`;

  await writeBillingPurchase(env, {
    id: purchaseId,
    userId: event.userId,
    productId: event.productId,
    kind: product.kind,
    provider: event.provider,
    providerSessionId: event.sessionId,
    providerEventId: event.id,
    status: "completed",
    createdAt: event.occurredAt,
    updatedAt: event.occurredAt,
  });

  if (product.kind === "api_pack" && product.tier && product.creditsTotal) {
    await grantApiPack(env, {
      id: purchaseId,
      userId: event.userId,
      tier: product.tier,
      creditsTotal: product.creditsTotal,
      creditsRemaining: product.creditsTotal,
      purchasedAt: event.occurredAt,
      expiresAt: addDays(event.occurredAt, 365),
    });
    return;
  }

  if (product.kind === "web_subscription" && product.planId && product.billingInterval && product.creditsTotal && product.durationDays) {
    await grantWebSubscriptionTerm(env, {
      id: purchaseId,
      userId: event.userId,
      planId: product.planId,
      billingInterval: product.billingInterval,
      creditsTotal: product.creditsTotal,
      startsAt: event.occurredAt,
      endsAt: addDays(event.occurredAt, product.durationDays),
      billingEmail: event.billingEmail ?? null,
      provider: event.provider,
    });
  }
}

function addDays(iso: string, days: number) {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}
