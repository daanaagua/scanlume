import { describe, expect, it } from "vitest";

import { buildAccountSnapshot } from "../account";

describe("buildAccountSnapshot", () => {
  it("reports a fresh 50 credits for logged-in users regardless of prior anonymous spend", async () => {
    const snapshot = await buildAccountSnapshot({} as never, {
      type: "user",
      user: {
        id: "user-1",
        email: "jam@example.com",
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
    } as never);

    expect(snapshot).toMatchObject({
      currentPlan: {
        label: "Conta gratuita",
      },
      usage: {
        grantedCredits: 50,
        remainingCredits: 50,
        usedCredits: 0,
      },
    });
  });

  it("returns Starter, Pro, and Business web plans with approved monthly prices", async () => {
    const snapshot = await buildAccountSnapshot({} as never, {
      type: "user",
      user: {
        id: "user-1",
        email: "jam@example.com",
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
    } as never);

    expect(snapshot.availablePlans.map((plan) => [plan.id, plan.priceLabel])).toContainEqual(["starter", "$5 / mes"]);
    expect(snapshot.availablePlans.map((plan) => [plan.id, plan.priceLabel])).toContainEqual(["pro", "$9 / mes"]);
    expect(snapshot.availablePlans.map((plan) => [plan.id, plan.priceLabel])).toContainEqual(["business", "$24 / mes"]);
  });

  it("exposes annual pricing metadata for Starter, Pro, and Business", async () => {
    const snapshot = await buildAccountSnapshot({} as never, {
      type: "user",
      user: {
        id: "user-1",
        email: "jam@example.com",
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
    } as never);

    expect(snapshot.notes.subscriptions).toContain("$48 / ano");
    expect(snapshot.notes.subscriptions).toContain("$82 / ano");
    expect(snapshot.notes.subscriptions).toContain("$228 / ano");
  });
});
