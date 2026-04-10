import { describe, expect, it } from "vitest";

import { readCreditBalance } from "../store";
import { grantWebSubscriptionTerm, readWebSubscription } from "../web-subscriptions";
import { consumeLoggedInWebCredits, resolveLoggedInWebCredits } from "../web-credits";
import { grantWebCreditPack, hasPurchasedWebCreditPack, readActiveWebCreditPack } from "../web-credit-packs";

describe("web credit packs", () => {
  it("records that the one-time web experience pack was purchased even after it expires", async () => {
    await grantWebCreditPack({} as never, {
      id: "web-pack-history-1",
      userId: "u-web-pack-history",
      productId: "web_experience_onetime",
      creditsTotal: 300,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2026-05-03T00:00:00.000Z",
    });

    await expect(hasPurchasedWebCreditPack({} as never, "u-web-pack-history")).resolves.toBe(true);
    await expect(readActiveWebCreditPack({} as never, "u-web-pack-history", "2026-05-04T00:00:00.000Z")).resolves.toBeNull();
  });

  it("resolves logged-in web balance in subscription then pack then free order", async () => {
    await grantWebSubscriptionTerm({} as never, {
      id: "term-web-balance-order",
      userId: "u-web-balance-order",
      planId: "starter",
      billingInterval: "month",
      creditsTotal: 8000,
      startsAt: "2026-04-03T00:00:00.000Z",
      endsAt: "2026-05-03T00:00:00.000Z",
    });
    await grantWebCreditPack({} as never, {
      id: "web-pack-balance-order",
      userId: "u-web-balance-order",
      productId: "web_experience_onetime",
      creditsTotal: 300,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2026-05-03T00:00:00.000Z",
    });
    await grantWebCreditPack({} as never, {
      id: "web-pack-balance-pack-only",
      userId: "u-web-balance-pack-only",
      productId: "web_experience_onetime",
      creditsTotal: 300,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2026-05-03T00:00:00.000Z",
    });

    await expect(resolveLoggedInWebCredits({} as never, { userId: "u-web-balance-order", now: "2026-04-10T00:00:00.000Z" })).resolves.toMatchObject({
      source: "subscription",
      grantedCredits: 8000,
      remainingCredits: 8000,
    });
    await expect(resolveLoggedInWebCredits({} as never, { userId: "u-web-balance-pack-only", now: "2026-04-10T00:00:00.000Z" })).resolves.toMatchObject({
      source: "web_experience_pack",
      grantedCredits: 300,
      remainingCredits: 300,
    });
    await expect(resolveLoggedInWebCredits({} as never, { userId: "u-web-balance-free-only", now: "2026-04-10T00:00:00.000Z" })).resolves.toMatchObject({
      source: "free",
      grantedCredits: 50,
      remainingCredits: 50,
    });
  });

  it("consumes the one-time pack before free credits when no paid web subscription is active", async () => {
    await grantWebCreditPack({} as never, {
      id: "web-pack-consume-order",
      userId: "u-web-pack-consume-order",
      productId: "web_experience_onetime",
      creditsTotal: 300,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2026-05-03T00:00:00.000Z",
    });

    await expect(consumeLoggedInWebCredits({} as never, {
      userId: "u-web-pack-consume-order",
      amount: 2,
      now: "2026-04-10T00:00:00.000Z",
    })).resolves.toMatchObject({
      ok: true,
      source: "web_experience_pack",
      remainingCredits: 298,
    });

    await expect(readActiveWebCreditPack({} as never, "u-web-pack-consume-order", "2026-04-10T00:00:00.000Z")).resolves.toMatchObject({
      creditsRemaining: 298,
    });
    await expect(readCreditBalance({} as never, { type: "user", key: "u-web-pack-consume-order" })).resolves.toMatchObject({
      remainingCredits: 50,
    });
  });

  it("keeps the one-time pack untouched while an active paid web subscription is consumed first", async () => {
    await grantWebSubscriptionTerm({} as never, {
      id: "term-web-pack-after-subscription",
      userId: "u-web-pack-after-subscription",
      planId: "starter",
      billingInterval: "month",
      creditsTotal: 8000,
      startsAt: "2026-04-03T00:00:00.000Z",
      endsAt: "2026-05-03T00:00:00.000Z",
    });
    await grantWebCreditPack({} as never, {
      id: "web-pack-after-subscription",
      userId: "u-web-pack-after-subscription",
      productId: "web_experience_onetime",
      creditsTotal: 300,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2026-05-03T00:00:00.000Z",
    });

    await expect(consumeLoggedInWebCredits({} as never, {
      userId: "u-web-pack-after-subscription",
      amount: 3,
      now: "2026-04-10T00:00:00.000Z",
    })).resolves.toMatchObject({
      ok: true,
      source: "subscription",
      remainingCredits: 7997,
    });

    await expect(readWebSubscription({} as never, "u-web-pack-after-subscription")).resolves.toMatchObject({
      creditsRemaining: 7997,
    });
    await expect(readActiveWebCreditPack({} as never, "u-web-pack-after-subscription", "2026-04-10T00:00:00.000Z")).resolves.toMatchObject({
      creditsRemaining: 300,
    });
  });
});
