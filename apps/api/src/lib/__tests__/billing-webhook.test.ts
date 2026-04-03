import { describe, expect, it } from "vitest";

import { createCheckoutSession, handleBillingWebhook } from "../billing";
import { readApiBalance } from "../api-usage";

describe("billing webhooks", () => {
  it("creates a checkout session for an API-only pack purchase", async () => {
    const response = await createCheckoutSession({} as never, {
      userId: "u1",
      product: "api_growth",
    });

    expect(response).toMatchObject({
      checkoutUrl: expect.any(String),
      product: "api_growth",
    });
  });

  it("credits the correct API pack after a paid webhook event", async () => {
    await handleBillingWebhook({} as never, {
      id: "evt_api_growth_1",
      provider: "creem",
      type: "checkout.completed",
      userId: "u1",
      productId: "api_growth",
      sessionId: "checkout_api_growth_1",
      occurredAt: "2026-04-03T00:00:00.000Z",
    });

    await expect(readApiBalance({} as never, "u1")).resolves.toMatchObject({
      remainingCredits: 40000,
      effectiveTier: "growth",
    });
  });
});
