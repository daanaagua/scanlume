import { describe, expect, it } from "vitest";

import { grantWebSubscriptionTerm, readWebSubscription } from "../web-subscriptions";

describe("web subscriptions", () => {
  it("activates a monthly web subscription and grants one non-rollover term bucket", async () => {
    const startsAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await grantWebSubscriptionTerm({} as never, {
      id: "term_starter_monthly_1",
      userId: "u1",
      planId: "starter",
      billingInterval: "month",
      creditsTotal: 8000,
      startsAt,
      endsAt,
    });

    await expect(readWebSubscription({} as never, "u1")).resolves.toMatchObject({
      planId: "starter",
      billingInterval: "month",
      creditsRemaining: 8000,
      rollover: false,
    });
  });
});
