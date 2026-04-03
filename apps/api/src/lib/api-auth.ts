import { readApiBalance } from "./api-usage";
import { listApiKeys, readApiKeyByHash, sha256Hex, writeApiKey, type ApiPackTier, type WorkerEnv } from "./store";

const API_LIMITS: Record<ApiPackTier, { perKeyRpm: number; accountAggregateRpm: number }> = {
  starter: { perKeyRpm: 30, accountAggregateRpm: 60 },
  growth: { perKeyRpm: 90, accountAggregateRpm: 180 },
  scale: { perKeyRpm: 300, accountAggregateRpm: 600 },
};

export async function createApiKey(env: WorkerEnv, input: { userId: string; label: string }) {
  const balance = await readApiBalance(env, input.userId);
  if (!balance.effectiveTier || balance.remainingCredits <= 0) {
    throw new Error("api_entitlement_required");
  }

  const keys = (await listApiKeys(env, input.userId)).filter((key) => !key.revokedAt);
  if (keys.length >= 3) {
    throw new Error("api_key_limit_reached");
  }

  const secret = buildApiSecret();
  const createdAt = new Date().toISOString();
  const id = crypto.randomUUID();
  const keyHash = await sha256Hex(secret);
  const lastFour = secret.slice(-4);
  await writeApiKey(env, {
    id,
    userId: input.userId,
    label: input.label,
    keyHash,
    lastFour,
    lastUsedAt: null,
    revokedAt: null,
    createdAt,
  });

  return {
    id,
    label: input.label,
    lastFour,
    secret,
  };
}

export async function regenerateApiKey(env: WorkerEnv, input: { userId: string; keyId: string }) {
  const keys = await listApiKeys(env, input.userId);
  const existing = keys.find((key) => key.id === input.keyId && !key.revokedAt);
  if (!existing) {
    throw new Error("api_key_not_found");
  }

  const secret = buildApiSecret();
  await writeApiKey(env, {
    ...existing,
    keyHash: await sha256Hex(secret),
    lastFour: secret.slice(-4),
  });

  return {
    id: existing.id,
    label: existing.label,
    lastFour: secret.slice(-4),
    secret,
  };
}

export async function checkApiRateLimit(
  _env: WorkerEnv,
  input: { userId: string; apiKeyId: string; effectiveTier: ApiPackTier },
) {
  const limits = API_LIMITS[input.effectiveTier];
  return {
    userId: input.userId,
    apiKeyId: input.apiKeyId,
    perKeyRpm: limits.perKeyRpm,
    accountAggregateRpm: limits.accountAggregateRpm,
  };
}

export async function authenticateApiKey(env: WorkerEnv, secret: string) {
  const keyHash = await sha256Hex(secret);
  const key = await readApiKeyByHash(env, keyHash);
  if (!key || key.revokedAt) {
    return null;
  }
  return key;
}

function buildApiSecret() {
  return `sk_live_${crypto.randomUUID().replaceAll("-", "")}`;
}
