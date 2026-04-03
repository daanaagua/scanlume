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
