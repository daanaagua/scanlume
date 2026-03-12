export interface WorkerEnv {
  APP_NAME?: string;
  APP_BASE_URL?: string;
  ARK_API_BASE: string;
  ARK_MODEL: string;
  ARK_API_KEY: string;
  TURNSTILE_SECRET_KEY?: string;
  DAILY_IMAGE_LIMIT?: string;
  DAILY_CREDIT_LIMIT?: string;
  SOFT_BUDGET_RMB?: string;
  HARD_BUDGET_RMB?: string;
  MAX_IMAGE_MB?: string;
  MAX_BATCH_FILES?: string;
  MAX_BATCH_TOTAL_MB?: string;
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

const memoryRates = new Map<string, RateState>();
const memoryBudgets = new Map<string, BudgetState>();

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

export async function persistUsageEvent(
  env: WorkerEnv,
  event: {
    id: string;
    ipHash: string;
    browserId: string;
    mode: string;
    imageCount: number;
    inputTokens: number;
    outputTokens: number;
    costRmb: number;
    createdAt: string;
    date: string;
    rateKey: string;
    usedImages: number;
    usedCredits: number;
    softStopped: boolean;
    hardStopped: boolean;
  },
) {
  if (!env.DB) {
    return;
  }

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO usage_events (
        id, ip_hash, browser_id, mode, image_count, input_tokens, output_tokens, cost_rmb, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ).bind(
      event.id,
      event.ipHash,
      event.browserId,
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
  ]);
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    "0.0.0.0"
  );
}
