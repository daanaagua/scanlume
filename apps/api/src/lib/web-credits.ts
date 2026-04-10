import { readCreditBalance, tryConsumeCredits, type WorkerEnv } from "./store";
import { consumeWebCreditPackCredits, readActiveWebCreditPack } from "./web-credit-packs";
import { consumeWebSubscriptionCredits, readWebSubscription } from "./web-subscriptions";

export type LoggedInWebCreditSource = "subscription" | "web_experience_pack" | "free";

export type LoggedInWebCreditState = {
  source: LoggedInWebCreditSource;
  grantedCredits: number;
  remainingCredits: number;
  usedCredits: number;
};

export async function resolveLoggedInWebCredits(
  env: WorkerEnv,
  input: { userId: string; now?: string },
): Promise<LoggedInWebCreditState> {
  const now = input.now ?? new Date().toISOString();
  const subscription = await readWebSubscription(env, input.userId, now);
  if (subscription) {
    return {
      source: "subscription",
      grantedCredits: subscription.creditsTotal,
      remainingCredits: subscription.creditsRemaining,
      usedCredits: Math.max(subscription.creditsTotal - subscription.creditsRemaining, 0),
    };
  }

  const pack = await readActiveWebCreditPack(env, input.userId, now);
  if (pack) {
    return {
      source: "web_experience_pack",
      grantedCredits: pack.creditsTotal,
      remainingCredits: pack.creditsRemaining,
      usedCredits: Math.max(pack.creditsTotal - pack.creditsRemaining, 0),
    };
  }

  const freeBalance = await readCreditBalance(env, { type: "user", key: input.userId });
  return {
    source: "free",
    grantedCredits: freeBalance.grantedCredits,
    remainingCredits: freeBalance.remainingCredits,
    usedCredits: freeBalance.usedCredits,
  };
}

export async function consumeLoggedInWebCredits(
  env: WorkerEnv,
  input: { userId: string; amount: number; now?: string },
): Promise<{ ok: boolean; source: LoggedInWebCreditSource; remainingCredits: number; grantedCredits: number }> {
  const now = input.now ?? new Date().toISOString();
  const subscription = await readWebSubscription(env, input.userId, now);
  if (subscription) {
    const settled = await consumeWebSubscriptionCredits(env, {
      userId: input.userId,
      amount: input.amount,
      now,
    });
    return {
      ...settled,
      source: "subscription",
    };
  }

  const pack = await readActiveWebCreditPack(env, input.userId, now);
  if (pack) {
    const settled = await consumeWebCreditPackCredits(env, {
      userId: input.userId,
      amount: input.amount,
      now,
    });
    return {
      ...settled,
      source: "web_experience_pack",
    };
  }

  const settled = await tryConsumeCredits(env, {
    actor: { type: "user", key: input.userId },
    amount: input.amount,
    now,
  });
  return {
    ...settled,
    source: "free",
  };
}
