import { describe, expect, it } from "vitest";

import { grantWebSubscriptionTerm, readWebSubscription } from "../web-subscriptions";

describe("web subscriptions", () => {
  it("activates a monthly web subscription and grants one non-rollover term bucket", async () => {
    await grantWebSubscriptionTerm({} as never, {
      id: "term_starter_monthly_1",
      userId: "u1",
      planId: "starter",
      billingInterval: "month",
      creditsTotal: 8000,
      startsAt: "2026-04-03T00:00:00.000Z",
      endsAt: "2026-05-03T00:00:00.000Z",
    });

    await expect(readWebSubscription({} as never, "u1")).resolves.toMatchObject({
      planId: "starter",
      billingInterval: "month",
      creditsRemaining: 8000,
      rollover: false,
    });
  });
});
