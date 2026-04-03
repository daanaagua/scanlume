import { readActiveWebSubscriptionTerm, writeUserSubscriptionState, writeWebSubscriptionTerm, type WorkerEnv, type WebSubscriptionTermState } from "./store";

export type ReadWebSubscriptionResult = {
  billingInterval: "month" | "year";
  creditsRemaining: number;
  creditsTotal: number;
  endsAt: string;
  planId: string;
  rollover: false;
  startsAt: string;
};

export async function grantWebSubscriptionTerm(
  env: WorkerEnv,
  input: {
    id: string;
    userId: string;
    planId: string;
    billingInterval: "month" | "year";
    creditsTotal: number;
    startsAt: string;
    endsAt: string;
    billingEmail?: string | null;
    provider?: string | null;
  },
) {
  const term: WebSubscriptionTermState = {
    id: input.id,
    userId: input.userId,
    planId: input.planId,
    billingInterval: input.billingInterval,
    creditsTotal: input.creditsTotal,
    creditsRemaining: input.creditsTotal,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    status: "active",
    createdAt: input.startsAt,
    updatedAt: input.startsAt,
  };

  await writeWebSubscriptionTerm(env, term);
  await writeUserSubscriptionState(env, {
    userId: input.userId,
    planId: input.planId,
    status: "active",
    provider: input.provider ?? null,
    billingEmail: input.billingEmail ?? null,
    currentPeriodStart: input.startsAt,
    currentPeriodEnd: input.endsAt,
    cancelAtPeriodEnd: 0,
  });

  return readWebSubscription(env, input.userId);
}

export async function readWebSubscription(env: WorkerEnv, userId: string): Promise<ReadWebSubscriptionResult | null> {
  const term = await readActiveWebSubscriptionTerm(env, userId);
  if (!term) {
    return null;
  }

  return {
    planId: term.planId,
    billingInterval: term.billingInterval,
    creditsRemaining: term.creditsRemaining,
    creditsTotal: term.creditsTotal,
    startsAt: term.startsAt,
    endsAt: term.endsAt,
    rollover: false,
  };
}

export async function consumeWebSubscriptionCredits(
  env: WorkerEnv,
  input: { userId: string; amount: number; now?: string },
): Promise<{ ok: boolean; remainingCredits: number; grantedCredits: number }> {
  const amount = Math.max(Math.trunc(input.amount), 0);
  const term = await readActiveWebSubscriptionTerm(env, input.userId, input.now);
  if (!term) {
    return { ok: false, remainingCredits: 0, grantedCredits: 0 };
  }

  if (amount === 0) {
    return { ok: true, remainingCredits: term.creditsRemaining, grantedCredits: term.creditsTotal };
  }

  if (term.creditsRemaining < amount) {
    return { ok: false, remainingCredits: term.creditsRemaining, grantedCredits: term.creditsTotal };
  }

  await writeWebSubscriptionTerm(env, {
    ...term,
    creditsRemaining: term.creditsRemaining - amount,
    updatedAt: input.now ?? new Date().toISOString(),
  });

  return {
    ok: true,
    remainingCredits: term.creditsRemaining - amount,
    grantedCredits: term.creditsTotal,
  };
}
