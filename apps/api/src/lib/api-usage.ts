import { listApiCreditPacks, writeApiCreditPack, type ApiCreditPackState, type ApiPackTier, type WorkerEnv } from "./store";

const API_TIER_ORDER: Record<ApiPackTier, number> = {
  starter: 1,
  growth: 2,
  scale: 3,
};

export type ApiBalanceSnapshot = {
  effectiveTier: ApiPackTier | null;
  remainingCredits: number;
  packs: ApiCreditPackState[];
};

export async function grantApiPack(env: WorkerEnv, pack: ApiCreditPackState) {
  await writeApiCreditPack(env, pack);
  return readApiBalance(env, pack.userId);
}

export async function readApiBalance(env: WorkerEnv, userId: string, now = new Date().toISOString()): Promise<ApiBalanceSnapshot> {
  const packs = (await listApiCreditPacks(env, userId))
    .filter((pack) => pack.creditsRemaining > 0 && pack.expiresAt > now)
    .sort((left, right) => left.expiresAt.localeCompare(right.expiresAt));

  const remainingCredits = packs.reduce((sum, pack) => sum + pack.creditsRemaining, 0);
  const effectiveTier = packs.reduce<ApiPackTier | null>((highest, pack) => {
    if (!highest) {
      return pack.tier;
    }
    return API_TIER_ORDER[pack.tier] > API_TIER_ORDER[highest] ? pack.tier : highest;
  }, null);

  return {
    effectiveTier,
    remainingCredits,
    packs,
  };
}

export async function consumeApiCredits(env: WorkerEnv, input: { userId: string; amount: number; now?: string }) {
  const amount = Math.max(Math.trunc(input.amount), 0);
  const balance = await readApiBalance(env, input.userId, input.now);
  if (amount === 0) {
    return { ok: true, remainingCredits: balance.remainingCredits };
  }
  if (balance.remainingCredits < amount) {
    return { ok: false, remainingCredits: balance.remainingCredits };
  }

  let remainingToConsume = amount;
  for (const pack of balance.packs) {
    if (remainingToConsume === 0) {
      break;
    }
    const consumed = Math.min(pack.creditsRemaining, remainingToConsume);
    remainingToConsume -= consumed;
    await writeApiCreditPack(env, {
      ...pack,
      creditsRemaining: pack.creditsRemaining - consumed,
    });
  }

  const next = await readApiBalance(env, input.userId, input.now);
  return { ok: true, remainingCredits: next.remainingCredits };
}
