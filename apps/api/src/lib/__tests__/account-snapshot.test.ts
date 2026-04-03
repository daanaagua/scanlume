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
});
