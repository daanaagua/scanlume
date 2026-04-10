import { listWebCreditPacks, writeWebCreditPack, type WebCreditPackState, type WorkerEnv } from "./store";

const WEB_EXPERIENCE_PRODUCT_ID = "web_experience_onetime";

type GrantWebCreditPackInput = {
  id: string;
  userId: string;
  productId: string;
  creditsTotal: number;
  purchasedAt: string;
  expiresAt: string;
};

function hydrateStatus(pack: WebCreditPackState, now: string) {
  if (pack.creditsRemaining <= 0 || pack.status === "consumed") {
    return "consumed";
  }
  if (pack.expiresAt <= now || pack.status === "expired") {
    return "expired";
  }
  return "active";
}

function withHydratedStatus(pack: WebCreditPackState, now: string) {
  return {
    ...pack,
    status: hydrateStatus(pack, now),
  } satisfies WebCreditPackState;
}

export async function grantWebCreditPack(env: WorkerEnv, input: GrantWebCreditPackInput) {
  const pack: WebCreditPackState = {
    id: input.id,
    userId: input.userId,
    productId: input.productId,
    creditsTotal: input.creditsTotal,
    creditsRemaining: input.creditsTotal,
    purchasedAt: input.purchasedAt,
    expiresAt: input.expiresAt,
    status: "active",
  };

  await writeWebCreditPack(env, pack);
  return withHydratedStatus(pack, input.purchasedAt);
}

export async function listUserWebCreditPacks(env: WorkerEnv, userId: string) {
  return listWebCreditPacks(env, userId);
}

export async function hasPurchasedWebCreditPack(env: WorkerEnv, userId: string, productId = WEB_EXPERIENCE_PRODUCT_ID) {
  const packs = await listWebCreditPacks(env, userId);
  return packs.some((pack) => pack.productId === productId);
}

export async function readLatestWebCreditPack(env: WorkerEnv, userId: string, productId = WEB_EXPERIENCE_PRODUCT_ID, now = new Date().toISOString()) {
  const packs = await listWebCreditPacks(env, userId);
  const pack = packs.find((entry) => entry.productId === productId);
  return pack ? withHydratedStatus(pack, now) : null;
}

export async function readActiveWebCreditPack(env: WorkerEnv, userId: string, now = new Date().toISOString(), productId = WEB_EXPERIENCE_PRODUCT_ID) {
  const latestPack = await readLatestWebCreditPack(env, userId, productId, now);
  return latestPack?.status === "active" ? latestPack : null;
}

export async function consumeWebCreditPackCredits(
  env: WorkerEnv,
  input: { userId: string; amount: number; now?: string; productId?: string },
): Promise<{ ok: boolean; remainingCredits: number; grantedCredits: number }> {
  const now = input.now ?? new Date().toISOString();
  const amount = Math.max(Math.trunc(input.amount), 0);
  const pack = await readActiveWebCreditPack(env, input.userId, now, input.productId ?? WEB_EXPERIENCE_PRODUCT_ID);

  if (!pack) {
    return { ok: false, remainingCredits: 0, grantedCredits: 0 };
  }

  if (amount === 0) {
    return {
      ok: true,
      remainingCredits: pack.creditsRemaining,
      grantedCredits: pack.creditsTotal,
    };
  }

  if (pack.creditsRemaining < amount) {
    return {
      ok: false,
      remainingCredits: pack.creditsRemaining,
      grantedCredits: pack.creditsTotal,
    };
  }

  const remainingCredits = pack.creditsRemaining - amount;
  await writeWebCreditPack(env, {
    ...pack,
    creditsRemaining: remainingCredits,
    status: remainingCredits === 0 ? "consumed" : "active",
  });

  return {
    ok: true,
    remainingCredits,
    grantedCredits: pack.creditsTotal,
  };
}
