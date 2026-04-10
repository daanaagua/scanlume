import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import app from "../../index";
import { createCheckoutSession, handleBillingWebhook, parseCreemWebhookEvent, verifyBillingWebhookSignature } from "../billing";
import { readApiBalance } from "../api-usage";
import { grantWebSubscriptionTerm } from "../web-subscriptions";
import { readActiveWebCreditPack } from "../web-credit-packs";
import { readUserSubscriptionState } from "../store";

function createUserRequest(userId: string, path: string, init?: RequestInit) {
  return new Request(`https://api.scanlume.com${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-test-user-id": userId,
      ...(init?.headers ?? {}),
    },
  });
}

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

  it("maps Scanlume billing products to Creem product ids for checkout", async () => {
    let captured: Record<string, unknown> | null = null;

    await createCheckoutSession({
      BILLING_PROVIDER: "creem",
      WEB_ORIGIN: "https://www.scanlume.com",
      CREEM_PRODUCT_MAP: JSON.stringify({ api_growth: "prod_creem_growth_123" }),
    } as never, {
      userId: "u1",
      product: "api_growth",
    }, {
      createCheckout: async (args) => {
        captured = args as unknown as Record<string, unknown>;
        return { checkoutUrl: "https://creem.test/checkout/chk_123" };
      },
    });

    expect(captured).toMatchObject({
      provider: "creem",
      product: "api_growth",
      providerProductId: "prod_creem_growth_123",
      successUrl: "https://www.scanlume.com/conta",
    });
  });

  it("verifies Creem webhook signatures with HMAC-SHA256", async () => {
    const payload = JSON.stringify({ hello: "world" });
    const secret = "creem-secret";
    const signature = createHmac("sha256", secret).update(payload).digest("hex");

    await expect(verifyBillingWebhookSignature(payload, secret, signature)).resolves.toBe(true);
    await expect(verifyBillingWebhookSignature(payload, secret, "bad-signature")).resolves.toBe(false);
  });

  it("normalizes Creem subscription events into internal webhook events", () => {
    const event = parseCreemWebhookEvent({
      CREEM_PRODUCT_MAP: JSON.stringify({ web_starter_monthly: "prod_creem_web_starter" }),
    } as never, {
      id: "evt_123",
      eventType: "subscription.paid",
      created_at: 1775174400000,
      object: {
        id: "sub_123",
        status: "active",
        current_period_start_date: "2026-04-03T00:00:00.000Z",
        current_period_end_date: "2026-05-03T00:00:00.000Z",
        product: { id: "prod_creem_web_starter" },
        customer: { email: "pony17620@gmail.com" },
        metadata: { userId: "u1" },
      },
    });

    expect(event).toMatchObject({
      id: "evt_123",
      provider: "creem",
      type: "subscription.paid",
      userId: "u1",
      productId: "web_starter_monthly",
      billingEmail: "pony17620@gmail.com",
      subscriptionStatus: "active",
      currentPeriodStart: "2026-04-03T00:00:00.000Z",
      currentPeriodEnd: "2026-05-03T00:00:00.000Z",
      shouldGrant: true,
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

  it("normalizes Creem checkout events for the one-time web experience pack", () => {
    const event = parseCreemWebhookEvent({
      CREEM_PRODUCT_MAP: JSON.stringify({ web_experience_onetime: "prod_creem_web_experience" }),
    } as never, {
      id: "evt_web_experience_1",
      eventType: "checkout.completed",
      created_at: 1775174400000,
      object: {
        id: "chk_web_experience_1",
        product: { id: "prod_creem_web_experience" },
        customer: { email: "pony17620@gmail.com" },
        metadata: { userId: "u-web-experience-1" },
      },
    });

    expect(event).toMatchObject({
      id: "evt_web_experience_1",
      provider: "creem",
      type: "checkout.completed",
      userId: "u-web-experience-1",
      productId: "web_experience_onetime",
      billingEmail: "pony17620@gmail.com",
      shouldGrant: true,
    });
  });

  it("grants a one-time web experience pack after a successful checkout webhook", async () => {
    await handleBillingWebhook({} as never, {
      id: "evt_web_experience_paid_1",
      provider: "creem",
      type: "checkout.completed",
      userId: "u-web-experience-grant",
      productId: "web_experience_onetime" as never,
      sessionId: "checkout_web_experience_1",
      occurredAt: "2026-04-03T00:00:00.000Z",
      billingEmail: "pony17620@gmail.com",
      shouldGrant: true,
    });

    await expect(readActiveWebCreditPack({} as never, "u-web-experience-grant", "2026-04-10T00:00:00.000Z")).resolves.toMatchObject({
      productId: "web_experience_onetime",
      creditsTotal: 300,
      creditsRemaining: 300,
      expiresAt: "2026-05-03T00:00:00.000Z",
      status: "active",
    });
  });

  it("syncs subscription status without granting extra credits on scheduled cancel", async () => {
    await handleBillingWebhook({} as never, {
      id: "evt_web_starter_paid_1",
      provider: "creem",
      type: "subscription.paid",
      userId: "u2",
      productId: "web_starter_monthly",
      sessionId: "sub_web_starter_1",
      occurredAt: "2026-04-03T00:00:00.000Z",
      billingEmail: "pony17620@gmail.com",
      subscriptionStatus: "active",
      currentPeriodStart: "2026-04-03T00:00:00.000Z",
      currentPeriodEnd: "2026-05-03T00:00:00.000Z",
      shouldGrant: true,
    });

    await handleBillingWebhook({} as never, {
      id: "evt_web_starter_cancel_1",
      provider: "creem",
      type: "subscription.scheduled_cancel",
      userId: "u2",
      productId: "web_starter_monthly",
      sessionId: "sub_web_starter_1",
      occurredAt: "2026-04-10T00:00:00.000Z",
      billingEmail: "pony17620@gmail.com",
      subscriptionStatus: "active",
      currentPeriodStart: "2026-04-03T00:00:00.000Z",
      currentPeriodEnd: "2026-05-03T00:00:00.000Z",
      cancelAtPeriodEnd: true,
      shouldGrant: false,
    });

    await expect(readUserSubscriptionState({} as never, "u2")).resolves.toMatchObject({
      planId: "starter",
      status: "active",
      cancelAtPeriodEnd: 1,
    });
  });

  it("rejects checkout when the account already purchased the one-time web experience pack", async () => {
    await handleBillingWebhook({} as never, {
      id: "evt_web_experience_paid_2",
      provider: "creem",
      type: "checkout.completed",
      userId: "u-web-experience-repeat",
      productId: "web_experience_onetime" as never,
      sessionId: "checkout_web_experience_repeat",
      occurredAt: "2026-04-03T00:00:00.000Z",
      shouldGrant: true,
    });

    const response = await app.fetch(
      createUserRequest("u-web-experience-repeat", "/v1/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ product: "web_experience_onetime" }),
      }),
      {} as never,
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "web_experience_already_purchased",
    });
  });

  it("rejects checkout when the account already has an active paid web plan", async () => {
    await grantWebSubscriptionTerm({} as never, {
      id: "term_starter_paid_plan_block",
      userId: "u-web-experience-paid-plan",
      planId: "starter",
      billingInterval: "month",
      creditsTotal: 8000,
      startsAt: "2026-04-03T00:00:00.000Z",
      endsAt: "2026-05-03T00:00:00.000Z",
    });

    const response = await app.fetch(
      createUserRequest("u-web-experience-paid-plan", "/v1/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ product: "web_experience_onetime" }),
      }),
      {} as never,
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "web_experience_paid_plan_active",
    });
  });
});
