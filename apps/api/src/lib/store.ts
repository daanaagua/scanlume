export interface WorkerEnv {
  APP_NAME?: string;
  APP_BASE_URL?: string;
  WEB_ORIGIN?: string;
  COOKIE_DOMAIN?: string;
  BILLING_PROVIDER?: string;
  BILLING_SUCCESS_URL?: string;
  BILLING_CANCEL_URL?: string;
  BILLING_WEBHOOK_SECRET?: string;
  CREEM_API_KEY?: string;
  CREEM_API_BASE?: string;
  CREEM_ENV?: string;
  ARK_API_BASE: string;
  ARK_MODEL: string;
  ARK_API_KEY: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  RESEND_API_KEY?: string;
  AUTH_EMAIL_FROM?: string;
  AUTH_EMAIL_REPLY_TO?: string;
  TURNSTILE_SECRET_KEY?: string;
  DAILY_IMAGE_LIMIT?: string;
  DAILY_CREDIT_LIMIT?: string;
  LOGGED_IN_DAILY_IMAGE_LIMIT?: string;
  LOGGED_IN_DAILY_CREDIT_LIMIT?: string;
  SOFT_BUDGET_RMB?: string;
  HARD_BUDGET_RMB?: string;
  MAX_IMAGE_MB?: string;
  PDF_MAX_FILE_MB?: string;
  PDF_MAX_PAGES_PER_DOCUMENT?: string;
  PDF_DAILY_PAGE_LIMIT_LOGGED_IN?: string;
  PDF_EXPORT_SIGNING_SECRET?: string;
  MAX_BATCH_FILES?: string;
  MAX_BATCH_TOTAL_MB?: string;
  SUPPORT_N8N_WEBHOOK_URL?: string;
  SUPPORT_N8N_WEBHOOK_SECRET?: string;
  SUPPORT_N8N_TIMEOUT_MS?: string;
  SUPPORT_SYNC_TOKEN?: string;
  RATE_LIMITS?: KVNamespace;
  DB?: D1Database;
  RESULTS?: R2Bucket;
}

export interface RateState {
  usedImages: number;
  usedCredits: number;
}

export interface BudgetState {
  totalCostRmb: number;
  totalRequests: number;
  totalImages: number;
}

export interface UserDailyUsageState {
  usedImages: number;
  usedCredits: number;
}

export interface UserDailyPdfUsageState {
  usedPages: number;
}

export interface CreditActor {
  type: "anonymous" | "user";
  key: string;
}

export interface CreditBalanceState {
  grantedCredits: number;
  usedCredits: number;
  remainingCredits: number;
}

type StoredCreditBalance = {
  grantedCredits: number;
  usedCredits: number;
  createdAt: string;
  updatedAt: string;
};

export type BillingPurchaseKind = "web_subscription" | "api_pack";

export interface BillingPurchaseState {
  id: string;
  userId: string;
  productId: string;
  kind: BillingPurchaseKind;
  provider: string;
  providerSessionId: string | null;
  providerEventId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebSubscriptionTermState {
  id: string;
  userId: string;
  planId: string;
  billingInterval: "month" | "year";
  creditsTotal: number;
  creditsRemaining: number;
  startsAt: string;
  endsAt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscriptionState {
  userId: string;
  planId: string;
  status: string;
  provider: string | null;
  billingEmail: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: number;
}

export type ApiPackTier = "starter" | "growth" | "scale";

export interface ApiCreditPackState {
  id: string;
  userId: string;
  tier: ApiPackTier;
  creditsTotal: number;
  creditsRemaining: number;
  purchasedAt: string;
  expiresAt: string;
}

const memoryRates = new Map<string, RateState>();
const memoryBudgets = new Map<string, BudgetState>();
const memoryUserUsage = new Map<string, UserDailyUsageState>();
const memoryUserPdfUsage = new Map<string, UserDailyPdfUsageState>();
const memoryCreditBalances = new Map<string, StoredCreditBalance>();
const memoryBillingPurchases = new Map<string, BillingPurchaseState>();
const memoryWebSubscriptionTerms = new Map<string, WebSubscriptionTermState>();
const memoryUserSubscriptions = new Map<string, UserSubscriptionState>();
const memoryApiCreditPacks = new Map<string, ApiCreditPackState>();

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function sha256Hex(input: string) {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (chunk) =>
    chunk.toString(16).padStart(2, "0"),
  ).join("");
}

export async function readRateState(env: WorkerEnv, key: string, date: string) {
  const storageKey = `rate:${date}:${key}`;
  if (env.RATE_LIMITS) {
    const raw = await env.RATE_LIMITS.get(storageKey);
    if (raw) {
      return JSON.parse(raw) as RateState;
    }
  }

  return memoryRates.get(storageKey) ?? { usedImages: 0, usedCredits: 0 };
}

export async function writeRateState(env: WorkerEnv, key: string, date: string, state: RateState) {
  const storageKey = `rate:${date}:${key}`;
  if (env.RATE_LIMITS) {
    await env.RATE_LIMITS.put(storageKey, JSON.stringify(state), {
      expirationTtl: 60 * 60 * 24 * 2,
    });
  }

  memoryRates.set(storageKey, state);
}

export async function readBudgetState(env: WorkerEnv, date: string) {
  const storageKey = `budget:${date}`;
  if (env.RATE_LIMITS) {
    const raw = await env.RATE_LIMITS.get(storageKey);
    if (raw) {
      return JSON.parse(raw) as BudgetState;
    }
  }

  return memoryBudgets.get(storageKey) ?? {
    totalCostRmb: 0,
    totalRequests: 0,
    totalImages: 0,
  };
}

export async function writeBudgetState(env: WorkerEnv, date: string, state: BudgetState) {
  const storageKey = `budget:${date}`;
  if (env.RATE_LIMITS) {
    await env.RATE_LIMITS.put(storageKey, JSON.stringify(state), {
      expirationTtl: 60 * 60 * 24 * 2,
    });
  }

  memoryBudgets.set(storageKey, state);
}

export async function readUserDailyUsage(env: WorkerEnv, userId: string, date: string) {
  const storageKey = `user-usage:${date}:${userId}`;
  if (env.DB) {
    const row = await env.DB.prepare(
      `SELECT used_images, used_credits FROM daily_user_usage WHERE user_id = ? AND date = ? LIMIT 1;`,
    )
      .bind(userId, date)
      .first<{ used_images: number; used_credits: number }>();

    if (row) {
      const state = {
        usedImages: row.used_images ?? 0,
        usedCredits: row.used_credits ?? 0,
      };
      memoryUserUsage.set(storageKey, state);
      return state;
    }
  }

  return memoryUserUsage.get(storageKey) ?? { usedImages: 0, usedCredits: 0 };
}

export async function writeUserDailyUsage(
  env: WorkerEnv,
  userId: string,
  date: string,
  state: UserDailyUsageState,
  updatedAt: string,
) {
  const storageKey = `user-usage:${date}:${userId}`;
  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO daily_user_usage (user_id, date, used_images, used_credits, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, date) DO UPDATE SET
         used_images = excluded.used_images,
         used_credits = excluded.used_credits,
         updated_at = excluded.updated_at;`,
    )
      .bind(userId, date, state.usedImages, state.usedCredits, updatedAt)
      .run();
  }

  memoryUserUsage.set(storageKey, state);
}

export async function readUserDailyPdfUsage(env: WorkerEnv, userId: string, date: string) {
  const storageKey = `user-pdf-usage:${date}:${userId}`;
  if (env.DB) {
    const row = await env.DB.prepare(
      `SELECT used_pages FROM daily_pdf_usage WHERE user_id = ? AND date = ? LIMIT 1;`,
    )
      .bind(userId, date)
      .first<{ used_pages: number }>();

    if (row) {
      const state = { usedPages: row.used_pages ?? 0 };
      memoryUserPdfUsage.set(storageKey, state);
      return state;
    }
  }

  return memoryUserPdfUsage.get(storageKey) ?? { usedPages: 0 };
}

export async function writeUserDailyPdfUsage(
  env: WorkerEnv,
  userId: string,
  date: string,
  state: UserDailyPdfUsageState,
  updatedAt: string,
) {
  const storageKey = `user-pdf-usage:${date}:${userId}`;
  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO daily_pdf_usage (user_id, date, used_pages, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, date) DO UPDATE SET
         used_pages = excluded.used_pages,
         updated_at = excluded.updated_at;`,
    )
      .bind(userId, date, state.usedPages, updatedAt)
      .run();
  }

  memoryUserPdfUsage.set(storageKey, state);
}

function buildCreditStorageKey(actor: CreditActor) {
  return `credits:${actor.type}:${actor.key}`;
}

function getDefaultGrantedCredits(actor: CreditActor) {
  return actor.type === "user" ? 50 : 5;
}

function toCreditBalanceState(balance: StoredCreditBalance): CreditBalanceState {
  return {
    grantedCredits: balance.grantedCredits,
    usedCredits: balance.usedCredits,
    remainingCredits: Math.max(balance.grantedCredits - balance.usedCredits, 0),
  };
}

async function ensureCreditBalance(env: WorkerEnv, actor: CreditActor, now = new Date().toISOString()) {
  const storageKey = buildCreditStorageKey(actor);
  const cached = memoryCreditBalances.get(storageKey);
  if (cached) {
    return cached;
  }

  if (env.DB) {
    const row = await env.DB.prepare(
      `SELECT granted_credits, used_credits, created_at, updated_at
       FROM credit_balances
       WHERE actor_type = ? AND actor_key = ?
       LIMIT 1;`,
    )
      .bind(actor.type, actor.key)
      .first<{ granted_credits: number; used_credits: number; created_at: string; updated_at: string }>();

    if (row) {
      const stored = {
        grantedCredits: row.granted_credits ?? getDefaultGrantedCredits(actor),
        usedCredits: row.used_credits ?? 0,
        createdAt: row.created_at ?? now,
        updatedAt: row.updated_at ?? now,
      } satisfies StoredCreditBalance;
      memoryCreditBalances.set(storageKey, stored);
      return stored;
    }

    const grantedCredits = getDefaultGrantedCredits(actor);
    await env.DB.prepare(
      `INSERT INTO credit_balances (actor_type, actor_key, granted_credits, used_credits, created_at, updated_at)
       VALUES (?, ?, ?, 0, ?, ?)
       ON CONFLICT(actor_type, actor_key) DO NOTHING;`,
    )
      .bind(actor.type, actor.key, grantedCredits, now, now)
      .run();

    const created = {
      grantedCredits,
      usedCredits: 0,
      createdAt: now,
      updatedAt: now,
    } satisfies StoredCreditBalance;
    memoryCreditBalances.set(storageKey, created);
    return created;
  }

  const created = {
    grantedCredits: getDefaultGrantedCredits(actor),
    usedCredits: 0,
    createdAt: now,
    updatedAt: now,
  } satisfies StoredCreditBalance;
  memoryCreditBalances.set(storageKey, created);
  return created;
}

export async function readCreditBalance(env: WorkerEnv, actor: CreditActor) {
  const balance = await ensureCreditBalance(env, actor);
  return toCreditBalanceState(balance);
}

export async function tryConsumeCredits(
  env: WorkerEnv,
  input: { actor: CreditActor; amount: number; now?: string },
): Promise<{ ok: boolean; remainingCredits: number }> {
  const now = input.now ?? new Date().toISOString();
  const amount = Math.max(Math.trunc(input.amount), 0);
  const current = await ensureCreditBalance(env, input.actor, now);

  if (amount === 0) {
    return {
      ok: true,
      remainingCredits: Math.max(current.grantedCredits - current.usedCredits, 0),
    };
  }

  if (env.DB) {
    const result = await env.DB.prepare(
      `UPDATE credit_balances
       SET used_credits = used_credits + ?, updated_at = ?
       WHERE actor_type = ?
         AND actor_key = ?
         AND used_credits + ? <= granted_credits;`,
    )
      .bind(amount, now, input.actor.type, input.actor.key, amount)
      .run();

    if ((result.meta?.changes ?? 0) > 0) {
      const updated = {
        ...current,
        usedCredits: current.usedCredits + amount,
        updatedAt: now,
      } satisfies StoredCreditBalance;
      memoryCreditBalances.set(buildCreditStorageKey(input.actor), updated);
      return {
        ok: true,
        remainingCredits: Math.max(updated.grantedCredits - updated.usedCredits, 0),
      };
    }

    const latest = await ensureCreditBalance(env, input.actor, now);
    return {
      ok: false,
      remainingCredits: Math.max(latest.grantedCredits - latest.usedCredits, 0),
    };
  }

  if (current.usedCredits + amount > current.grantedCredits) {
    return {
      ok: false,
      remainingCredits: Math.max(current.grantedCredits - current.usedCredits, 0),
    };
  }

  const updated = {
    ...current,
    usedCredits: current.usedCredits + amount,
    updatedAt: now,
  } satisfies StoredCreditBalance;
  memoryCreditBalances.set(buildCreditStorageKey(input.actor), updated);
  return {
    ok: true,
    remainingCredits: Math.max(updated.grantedCredits - updated.usedCredits, 0),
  };
}

export async function writeBillingPurchase(env: WorkerEnv, purchase: BillingPurchaseState) {
  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO billing_purchases (
        id, user_id, product_id, kind, provider, provider_session_id, provider_event_id, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        product_id = excluded.product_id,
        kind = excluded.kind,
        provider = excluded.provider,
        provider_session_id = excluded.provider_session_id,
        provider_event_id = excluded.provider_event_id,
        status = excluded.status,
        updated_at = excluded.updated_at;`,
    )
      .bind(
        purchase.id,
        purchase.userId,
        purchase.productId,
        purchase.kind,
        purchase.provider,
        purchase.providerSessionId,
        purchase.providerEventId,
        purchase.status,
        purchase.createdAt,
        purchase.updatedAt,
      )
      .run();
  }

  memoryBillingPurchases.set(purchase.id, purchase);
}

export async function writeWebSubscriptionTerm(env: WorkerEnv, term: WebSubscriptionTermState) {
  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO web_subscription_terms (
        id, user_id, plan_id, billing_interval, credits_total, credits_remaining, starts_at, ends_at, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        plan_id = excluded.plan_id,
        billing_interval = excluded.billing_interval,
        credits_total = excluded.credits_total,
        credits_remaining = excluded.credits_remaining,
        starts_at = excluded.starts_at,
        ends_at = excluded.ends_at,
        status = excluded.status,
        updated_at = excluded.updated_at;`,
    )
      .bind(
        term.id,
        term.userId,
        term.planId,
        term.billingInterval,
        term.creditsTotal,
        term.creditsRemaining,
        term.startsAt,
        term.endsAt,
        term.status,
        term.createdAt,
        term.updatedAt,
      )
      .run();
  }

  memoryWebSubscriptionTerms.set(term.id, term);
}

export async function readActiveWebSubscriptionTerm(env: WorkerEnv, userId: string, now = new Date().toISOString()) {
  const memoryTerms = [...memoryWebSubscriptionTerms.values()]
    .filter((term) => term.userId === userId && term.status === "active" && term.endsAt > now)
    .sort((left, right) => left.endsAt.localeCompare(right.endsAt));

  if (env.DB) {
    const row = await env.DB.prepare(
      `SELECT id, user_id, plan_id, billing_interval, credits_total, credits_remaining, starts_at, ends_at, status, created_at, updated_at
       FROM web_subscription_terms
       WHERE user_id = ? AND status = 'active' AND ends_at > ?
       ORDER BY ends_at DESC
       LIMIT 1;`,
    )
      .bind(userId, now)
      .first<{
        id: string;
        user_id: string;
        plan_id: string;
        billing_interval: "month" | "year";
        credits_total: number;
        credits_remaining: number;
        starts_at: string;
        ends_at: string;
        status: string;
        created_at: string;
        updated_at: string;
      }>();

    if (row) {
      const term = {
        id: row.id,
        userId: row.user_id,
        planId: row.plan_id,
        billingInterval: row.billing_interval,
        creditsTotal: row.credits_total,
        creditsRemaining: row.credits_remaining,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      } satisfies WebSubscriptionTermState;
      memoryWebSubscriptionTerms.set(term.id, term);
      return term;
    }
  }

  return memoryTerms.at(-1) ?? null;
}

export async function writeUserSubscriptionState(env: WorkerEnv, subscription: UserSubscriptionState) {
  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO user_subscriptions (
        user_id, plan_id, status, provider, billing_email, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        plan_id = excluded.plan_id,
        status = excluded.status,
        provider = excluded.provider,
        billing_email = excluded.billing_email,
        current_period_start = excluded.current_period_start,
        current_period_end = excluded.current_period_end,
        cancel_at_period_end = excluded.cancel_at_period_end,
        updated_at = excluded.updated_at;`,
    )
      .bind(
        subscription.userId,
        subscription.planId,
        subscription.status,
        subscription.provider,
        subscription.billingEmail,
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd,
        subscription.cancelAtPeriodEnd,
        subscription.currentPeriodStart ?? new Date().toISOString(),
        subscription.currentPeriodEnd ?? new Date().toISOString(),
      )
      .run();
  }

  memoryUserSubscriptions.set(subscription.userId, subscription);
}

export async function readUserSubscriptionState(env: WorkerEnv, userId: string) {
  if (env.DB) {
    const row = await env.DB.prepare(
      `SELECT plan_id, status, provider, billing_email, current_period_start, current_period_end, cancel_at_period_end
       FROM user_subscriptions
       WHERE user_id = ?
       LIMIT 1;`,
    )
      .bind(userId)
      .first<{
        plan_id: string;
        status: string;
        provider: string | null;
        billing_email: string | null;
        current_period_start: string | null;
        current_period_end: string | null;
        cancel_at_period_end: number;
      }>();

    if (row) {
      const subscription = {
        userId,
        planId: row.plan_id,
        status: row.status,
        provider: row.provider,
        billingEmail: row.billing_email,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end,
        cancelAtPeriodEnd: row.cancel_at_period_end ?? 0,
      } satisfies UserSubscriptionState;
      memoryUserSubscriptions.set(userId, subscription);
      return subscription;
    }
  }

  return memoryUserSubscriptions.get(userId) ?? null;
}

export async function writeApiCreditPack(env: WorkerEnv, pack: ApiCreditPackState) {
  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO api_credit_packs (
        id, user_id, tier, credits_total, credits_remaining, purchased_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        tier = excluded.tier,
        credits_total = excluded.credits_total,
        credits_remaining = excluded.credits_remaining,
        purchased_at = excluded.purchased_at,
        expires_at = excluded.expires_at;`,
    )
      .bind(pack.id, pack.userId, pack.tier, pack.creditsTotal, pack.creditsRemaining, pack.purchasedAt, pack.expiresAt)
      .run();
  }

  memoryApiCreditPacks.set(pack.id, pack);
}

export async function listApiCreditPacks(env: WorkerEnv, userId: string) {
  const memoryPacks = [...memoryApiCreditPacks.values()].filter((pack) => pack.userId === userId);

  if (env.DB) {
    const { results } = await env.DB.prepare(
      `SELECT id, user_id, tier, credits_total, credits_remaining, purchased_at, expires_at
       FROM api_credit_packs
       WHERE user_id = ?
       ORDER BY expires_at ASC;`,
    )
      .bind(userId)
      .all<{
        id: string;
        user_id: string;
        tier: ApiPackTier;
        credits_total: number;
        credits_remaining: number;
        purchased_at: string;
        expires_at: string;
      }>();

    if (results.length > 0) {
      const packs = results.map((row) => ({
        id: row.id,
        userId: row.user_id,
        tier: row.tier,
        creditsTotal: row.credits_total,
        creditsRemaining: row.credits_remaining,
        purchasedAt: row.purchased_at,
        expiresAt: row.expires_at,
      } satisfies ApiCreditPackState));
      for (const pack of packs) {
        memoryApiCreditPacks.set(pack.id, pack);
      }
      return packs;
    }
  }

  return memoryPacks.sort((left, right) => left.expiresAt.localeCompare(right.expiresAt));
}

export async function persistUsageEvent(
  env: WorkerEnv,
  event: {
    id: string;
    ipHash: string;
    browserId: string;
    userId?: string | null;
    mode: string;
    imageCount: number;
    inputTokens: number;
    outputTokens: number;
    costRmb: number;
    createdAt: string;
    date: string;
    rateKey?: string;
    usedImages?: number;
    usedCredits?: number;
    softStopped: boolean;
    hardStopped: boolean;
  },
) {
  if (!env.DB) {
    return;
  }

  const statements = [
    env.DB.prepare(
      `INSERT INTO usage_events (
        id, ip_hash, browser_id, user_id, mode, image_count, input_tokens, output_tokens, cost_rmb, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ).bind(
      event.id,
      event.ipHash,
      event.browserId,
      event.userId ?? null,
      event.mode,
      event.imageCount,
      event.inputTokens,
      event.outputTokens,
      event.costRmb,
      event.createdAt,
    ),
    env.DB.prepare(
      `INSERT INTO daily_budget (date, total_cost_rmb, total_requests, total_images, soft_stopped, hard_stopped)
       VALUES (?, ?, 1, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         total_cost_rmb = total_cost_rmb + excluded.total_cost_rmb,
         total_requests = total_requests + 1,
         total_images = total_images + excluded.total_images,
         soft_stopped = excluded.soft_stopped,
         hard_stopped = excluded.hard_stopped;`,
    ).bind(
      event.date,
      event.costRmb,
      event.imageCount,
      event.softStopped ? 1 : 0,
      event.hardStopped ? 1 : 0,
    ),
  ];

  if (event.rateKey && typeof event.usedImages === "number" && typeof event.usedCredits === "number") {
    statements.push(
      env.DB.prepare(
        `INSERT INTO rate_limits (key, date, used_images, used_credits, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(key, date) DO UPDATE SET
           used_images = excluded.used_images,
           used_credits = excluded.used_credits,
           updated_at = excluded.updated_at;`,
      ).bind(
        event.rateKey,
        event.date,
        event.usedImages,
        event.usedCredits,
        event.createdAt,
      ),
    );
  }

  await env.DB.batch(statements);
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    "0.0.0.0"
  );
}
