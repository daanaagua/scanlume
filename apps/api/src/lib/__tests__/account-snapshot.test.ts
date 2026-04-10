import { describe, expect, it } from "vitest";

import { buildAccountSnapshot } from "../account";
import { writeUserSubscriptionState } from "../store";
import { grantWebCreditPack } from "../web-credit-packs";

function createViewer(id = "user-1") {
  return {
    type: "user" as const,
    user: {
      id,
      email: `${id}@example.com`,
      name: "Jam Test",
      avatarUrl: null,
      emailVerified: true,
      emailVerifiedAt: null,
      hasPassword: true,
      authProviders: ["password"],
    },
    dailyImageLimit: 100,
    dailyCreditLimit: 100,
    usage: {
      usedImages: 0,
      usedCredits: 0,
    },
    balance: {
      grantedCredits: 50,
      usedCredits: 0,
      remainingCredits: 50,
    },
  };
}

describe("buildAccountSnapshot", () => {
  it("reports a fresh 50 credits for logged-in users regardless of prior anonymous spend", async () => {
    const snapshot = await buildAccountSnapshot({} as never, createViewer("user-1") as never);

    expect(snapshot).toMatchObject({
      currentPlan: {
        label: "Conta gratuita",
      },
      usage: {
        grantedCredits: 50,
        remainingCredits: 50,
        usedCredits: 0,
      },
      webExperience: {
        status: "available",
        canPurchase: true,
        hasPurchased: false,
        creditsTotal: null,
        creditsRemaining: null,
        expiresAt: null,
      },
    });
  });

  it("returns Starter, Pro, and Business web plans with approved monthly prices", async () => {
    const snapshot = await buildAccountSnapshot({} as never, createViewer("user-2") as never);

    expect(snapshot.availablePlans.map((plan) => [plan.id, plan.priceLabel])).toContainEqual(["starter", "$5 / mes"]);
    expect(snapshot.availablePlans.map((plan) => [plan.id, plan.priceLabel])).toContainEqual(["pro", "$9 / mes"]);
    expect(snapshot.availablePlans.map((plan) => [plan.id, plan.priceLabel])).toContainEqual(["business", "$24 / mes"]);
  });

  it("exposes annual pricing metadata for Starter, Pro, and Business", async () => {
    const snapshot = await buildAccountSnapshot({} as never, createViewer("user-3") as never);

    expect(snapshot.notes.subscriptions).toContain("$48 / ano");
    expect(snapshot.notes.subscriptions).toContain("$82 / ano");
    expect(snapshot.notes.subscriptions).toContain("$228 / ano");
  });

  it("marks web experience as paid_plan_active when a paid web subscription is active", async () => {
    await writeUserSubscriptionState({} as never, {
      userId: "user-paid-plan",
      planId: "starter",
      status: "active",
      provider: "creem",
      billingEmail: "user-paid-plan@example.com",
      currentPeriodStart: "2026-04-03T00:00:00.000Z",
      currentPeriodEnd: "2026-05-03T00:00:00.000Z",
      cancelAtPeriodEnd: 0,
    });

    const snapshot = await buildAccountSnapshot({} as never, createViewer("user-paid-plan") as never);

    expect(snapshot.webExperience).toEqual({
      status: "paid_plan_active",
      canPurchase: false,
      hasPurchased: false,
      creditsTotal: null,
      creditsRemaining: null,
      expiresAt: null,
    });
  });

  it("reports active one-time web experience balances after purchase", async () => {
    await grantWebCreditPack({} as never, {
      id: "web-pack-account-active",
      userId: "user-web-pack-active",
      productId: "web_experience_onetime",
      creditsTotal: 1600,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2026-05-03T00:00:00.000Z",
    });

    const snapshot = await buildAccountSnapshot({} as never, createViewer("user-web-pack-active") as never);

    expect(snapshot.webExperience).toEqual({
      status: "active",
      canPurchase: false,
      hasPurchased: true,
      creditsTotal: 1600,
      creditsRemaining: 1600,
      expiresAt: "2026-05-03T00:00:00.000Z",
    });
  });
});
