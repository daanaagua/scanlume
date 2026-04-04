import { grantApiPack } from "./api-usage";
import {
  readActiveWebSubscriptionTerm,
  writeBillingPurchase,
  writeUserSubscriptionState,
  writeWebSubscriptionTerm,
  type BillingPurchaseKind,
  type WorkerEnv,
} from "./store";
import { grantWebSubscriptionTerm } from "./web-subscriptions";

const BILLING_PRODUCT_IDS = [
  "web_starter_monthly",
  "web_pro_monthly",
  "web_business_monthly",
  "web_starter_yearly",
  "web_pro_yearly",
  "web_business_yearly",
  "api_starter",
  "api_growth",
  "api_scale",
] as const;

export type BillingProductId = (typeof BILLING_PRODUCT_IDS)[number];

type BillingWebhookEvent = {
  id: string;
  provider: string;
  type: string;
  userId: string;
  productId: BillingProductId;
  sessionId: string;
  occurredAt: string;
  billingEmail?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  subscriptionStatus?: string | null;
  shouldGrant?: boolean;
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
    createCheckout?: (args: {
      provider: string;
      product: BillingProductId;
      providerProductId?: string;
      requestId: string;
      successUrl: string;
      userId: string;
    }) => Promise<{ checkoutUrl: string }>;
  },
) {
  const provider = resolveBillingProvider(env);
  const successUrl = resolveBillingSuccessUrl(env);
  const requestId = `scanlume_${input.product}_${input.userId}_${Date.now()}`;
  const providerProductId = provider === "creem" ? resolveCreemProductId(env, input.product) : undefined;

  if (provider === "creem" && !providerProductId) {
    throw new Error(`Missing Creem product mapping for ${input.product}.`);
  }

  const checkout = deps?.createCheckout
    ? await deps.createCheckout({
        provider,
        product: input.product,
        providerProductId: providerProductId ?? undefined,
        requestId,
        successUrl,
        userId: input.userId,
      })
    : provider === "creem"
      ? await createCreemCheckout(env, {
          product: input.product,
          providerProductId: providerProductId!,
          requestId,
          successUrl,
          userId: input.userId,
        })
      : { checkoutUrl: `https://checkout.${provider}.test/${input.product}?user=${encodeURIComponent(input.userId)}` };

  return {
    checkoutUrl: checkout.checkoutUrl,
    product: input.product,
  };
}

export async function handleBillingWebhook(env: WorkerEnv, event: BillingWebhookEvent) {
  const product = BILLING_PRODUCT_CONFIG[event.productId];
  const purchaseId = `${event.provider}:${event.id}`;

  if (product.kind === "web_subscription") {
    await syncWebSubscriptionState(env, event, product);
  }

  if (event.shouldGrant === false) {
    return;
  }

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
      startsAt: event.currentPeriodStart ?? event.occurredAt,
      endsAt: event.currentPeriodEnd ?? addDays(event.occurredAt, product.durationDays),
      billingEmail: event.billingEmail ?? null,
      provider: event.provider,
    });
  }
}

export async function verifyBillingWebhookSignature(payload: string, secret: string, signature: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const hex = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
  return hex === signature.trim();
}

export function parseCreemWebhookEvent(env: WorkerEnv, payload: unknown): BillingWebhookEvent | null {
  const event = payload as {
    id?: string;
    eventType?: string;
    created_at?: number | string;
    object?: Record<string, unknown>;
  };

  if (!event?.id || !event?.eventType || !event?.object) {
    return null;
  }

  const object = event.object;
  const providerProductId = extractCreemProductId(object.product);
  const billingProductId = providerProductId ? resolveBillingProductIdFromCreem(env, providerProductId) : null;
  const userId = extractCreemUserId(object);
  const sessionId = readString(object.id) ?? event.id;
  const billingEmail = extractCreemBillingEmail(object);
  const occurredAt = normalizeCreemDate(event.created_at);

  if (!billingProductId || !userId || !sessionId || !occurredAt) {
    return null;
  }

  if (event.eventType === "checkout.completed") {
    const product = BILLING_PRODUCT_CONFIG[billingProductId];
    if (product.kind !== "api_pack") {
      return null;
    }

    return {
      id: event.id,
      provider: "creem",
      type: event.eventType,
      userId,
      productId: billingProductId,
      sessionId,
      occurredAt,
      billingEmail,
      shouldGrant: true,
    };
  }

  if (!event.eventType.startsWith("subscription.")) {
    return null;
  }

  return {
    id: event.id,
    provider: "creem",
    type: event.eventType,
    userId,
    productId: billingProductId,
    sessionId,
    occurredAt,
    billingEmail,
    currentPeriodStart: readString(object.current_period_start_date) ?? null,
    currentPeriodEnd: readString(object.current_period_end_date) ?? null,
    cancelAtPeriodEnd: event.eventType === "subscription.scheduled_cancel",
    subscriptionStatus: normalizeCreemSubscriptionStatus(event.eventType, readString(object.status)),
    shouldGrant: event.eventType === "subscription.paid",
  };
}

async function createCreemCheckout(
  env: WorkerEnv,
  input: {
    product: BillingProductId;
    providerProductId: string;
    requestId: string;
    successUrl: string;
    userId: string;
  },
) {
  if (!env.CREEM_API_KEY) {
    throw new Error("Missing CREEM_API_KEY.");
  }

  const response = await fetch(`${resolveCreemApiBase(env)}/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.CREEM_API_KEY,
    },
    body: JSON.stringify({
      request_id: input.requestId,
      product_id: input.providerProductId,
      success_url: input.successUrl,
      metadata: {
        billingProductId: input.product,
        userId: input.userId,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Creem checkout creation failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const payload = await response.json() as { checkout_url?: string };
  if (!payload.checkout_url) {
    throw new Error("Creem checkout response missing checkout_url.");
  }

  return { checkoutUrl: payload.checkout_url };
}

function resolveBillingProvider(env: WorkerEnv) {
  return env.BILLING_PROVIDER ?? (env.CREEM_API_KEY ? "creem" : "mock");
}

function resolveBillingSuccessUrl(env: WorkerEnv) {
  return env.BILLING_SUCCESS_URL ?? `${env.WEB_ORIGIN ?? env.APP_BASE_URL ?? "https://www.scanlume.com"}/conta`;
}

function resolveCreemApiBase(env: WorkerEnv) {
  if (env.CREEM_API_BASE) {
    return env.CREEM_API_BASE.replace(/\/$/, "");
  }

  return env.CREEM_ENV === "test" ? "https://test-api.creem.io/v1" : "https://api.creem.io/v1";
}

function resolveCreemProductId(env: WorkerEnv, product: BillingProductId) {
  return readCreemProductMap(env)[product] ?? null;
}

function resolveBillingProductIdFromCreem(env: WorkerEnv, providerProductId: string) {
  const entry = Object.entries(readCreemProductMap(env)).find(([, value]) => value === providerProductId);
  const candidate = entry?.[0];
  return candidate && BILLING_PRODUCT_IDS.includes(candidate as BillingProductId) ? candidate as BillingProductId : null;
}

function readCreemProductMap(env: WorkerEnv) {
  if (!env.CREEM_PRODUCT_MAP) {
    return {} as Partial<Record<BillingProductId, string>>;
  }

  try {
    const parsed = JSON.parse(env.CREEM_PRODUCT_MAP) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [BillingProductId, string] => BILLING_PRODUCT_IDS.includes(entry[0] as BillingProductId) && typeof entry[1] === "string"),
    ) as Partial<Record<BillingProductId, string>>;
  } catch {
    return {} as Partial<Record<BillingProductId, string>>;
  }
}

function extractCreemProductId(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object") {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

function extractCreemUserId(object: Record<string, unknown>) {
  const metadata = object.metadata;
  if (metadata && typeof metadata === "object") {
    const userId = (metadata as { userId?: unknown }).userId;
    return typeof userId === "string" ? userId : null;
  }
  return null;
}

function extractCreemBillingEmail(object: Record<string, unknown>) {
  const customer = object.customer;
  if (customer && typeof customer === "object") {
    const email = (customer as { email?: unknown }).email;
    return typeof email === "string" ? email : null;
  }
  return null;
}

function normalizeCreemDate(value: unknown) {
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return null;
}

function normalizeCreemSubscriptionStatus(eventType: string, status: string | null) {
  if (eventType === "subscription.scheduled_cancel") {
    return "active";
  }
  if (eventType === "subscription.canceled" || eventType === "subscription.expired") {
    return "canceled";
  }
  if (eventType === "subscription.past_due") {
    return "past_due";
  }
  if (eventType === "subscription.trialing") {
    return "trialing";
  }
  if (status === "trialing") {
    return "trialing";
  }
  return "active";
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

async function syncWebSubscriptionState(env: WorkerEnv, event: BillingWebhookEvent, product: ProductConfig) {
  if (!product.planId) {
    return;
  }

  const status = event.subscriptionStatus ?? "active";
  await writeUserSubscriptionState(env, {
    userId: event.userId,
    planId: product.planId,
    status,
    provider: event.provider,
    billingEmail: event.billingEmail ?? null,
    currentPeriodStart: event.currentPeriodStart ?? null,
    currentPeriodEnd: event.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: event.cancelAtPeriodEnd ? 1 : 0,
  });

  if (status === "canceled" || status === "past_due") {
    const activeTerm = await readActiveWebSubscriptionTerm(env, event.userId, event.occurredAt);
    if (activeTerm) {
      await writeWebSubscriptionTerm(env, {
        ...activeTerm,
        status: "canceled",
        endsAt: event.currentPeriodEnd ?? event.occurredAt,
        updatedAt: event.occurredAt,
      });
    }
  }
}

function addDays(iso: string, days: number) {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}
