import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../../index";
import { grantWebSubscriptionTerm, readWebSubscription } from "../web-subscriptions";
import { readCreditBalance, sha256Hex } from "../store";
import { grantWebCreditPack, readActiveWebCreditPack } from "../web-credit-packs";

function createEnv() {
  return {
    ARK_API_BASE: "https://ark.test",
    ARK_MODEL: "mock-model",
    ARK_API_KEY: "mock-key",
  };
}

function createImageRequest(browserId: string, mode: "simple" | "formatted") {
  return new Request("https://api.scanlume.com/v1/ocr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode,
      browserId,
      image: {
        name: "receipt.png",
        mimeType: "image/png",
        dataUrl: "data:image/png;base64,ZmFrZQ==",
        size: 1024,
      },
    }),
  });
}

function createUserImageRequest(userId: string, mode: "simple" | "formatted") {
  return new Request("https://api.scanlume.com/v1/ocr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": userId,
    },
    body: JSON.stringify({
      mode,
      image: {
        name: "receipt.png",
        mimeType: "image/png",
        dataUrl: "data:image/png;base64,ZmFrZQ==",
        size: 1024,
      },
    }),
  });
}

async function readAnonymousBalance(env: ReturnType<typeof createEnv>, browserId: string) {
  const actorKey = await sha256Hex(`0.0.0.0:${browserId}`);
  return readCreditBalance(env as never, { type: "anonymous", key: actorKey });
}

describe("/v1/ocr credit settlement", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("charges 1 credit for simple OCR and 2 for formatted OCR", async () => {
    const env = createEnv();
    const browserId = "anon-ocr-priced";
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ output_text: "simple text", usage: { input_tokens: 0, output_tokens: 0 } }), { status: 200 }),
    );
    let response = await app.fetch(createImageRequest(browserId, "simple"), env as never);
    expect(response.status).toBe(200);
    await expect(readAnonymousBalance(env, browserId)).resolves.toMatchObject({ remainingCredits: 4 });

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ blocks: [{ type: "p", text: "formatted", order: 0 }] }) } }], usage: { input_tokens: 0, output_tokens: 0 } }), { status: 200 }),
    );
    response = await app.fetch(createImageRequest(browserId, "formatted"), env as never);
    expect(response.status).toBe(200);
    await expect(readAnonymousBalance(env, browserId)).resolves.toMatchObject({ remainingCredits: 2 });
  });

  it("does not deduct credits when OCR fails", async () => {
    const env = createEnv();
    const browserId = "anon-ocr-failure";
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce(new Response("upstream failed", { status: 500 }));

    const response = await app.fetch(createImageRequest(browserId, "simple"), env as never);

    expect(response.status).toBe(502);
    await expect(readAnonymousBalance(env, browserId)).resolves.toMatchObject({ remainingCredits: 5 });
  });

  it("charges an active one-time web experience pack before free logged-in credits", async () => {
    const env = createEnv();
    const fetchMock = vi.mocked(fetch);

    await grantWebCreditPack({} as never, {
      id: "web-pack-ocr-route",
      userId: "u-web-pack-ocr-route",
      productId: "web_experience_onetime",
      creditsTotal: 300,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2026-05-03T00:00:00.000Z",
    });
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ output_text: "simple text", usage: { input_tokens: 0, output_tokens: 0 } }), { status: 200 }),
    );

    const response = await app.fetch(createUserImageRequest("u-web-pack-ocr-route", "simple"), env as never);

    expect(response.status).toBe(200);
    await expect(readActiveWebCreditPack({} as never, "u-web-pack-ocr-route", "2026-04-10T00:00:00.000Z")).resolves.toMatchObject({
      creditsRemaining: 299,
    });
    await expect(readCreditBalance({} as never, { type: "user", key: "u-web-pack-ocr-route" })).resolves.toMatchObject({
      remainingCredits: 50,
    });
  });

  it("keeps the one-time pack untouched while an active paid web subscription is charged first", async () => {
    const env = createEnv();
    const fetchMock = vi.mocked(fetch);

    await grantWebSubscriptionTerm({} as never, {
      id: "term-ocr-route-priority",
      userId: "u-ocr-route-priority",
      planId: "starter",
      billingInterval: "month",
      creditsTotal: 8000,
      startsAt: "2026-04-03T00:00:00.000Z",
      endsAt: "2026-05-03T00:00:00.000Z",
    });
    await grantWebCreditPack({} as never, {
      id: "web-pack-ocr-route-priority",
      userId: "u-ocr-route-priority",
      productId: "web_experience_onetime",
      creditsTotal: 300,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2026-05-03T00:00:00.000Z",
    });
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ output_text: "simple text", usage: { input_tokens: 0, output_tokens: 0 } }), { status: 200 }),
    );

    const response = await app.fetch(createUserImageRequest("u-ocr-route-priority", "simple"), env as never);

    expect(response.status).toBe(200);
    await expect(readWebSubscription({} as never, "u-ocr-route-priority")).resolves.toMatchObject({
      creditsRemaining: 7999,
    });
    await expect(readActiveWebCreditPack({} as never, "u-ocr-route-priority", "2026-04-10T00:00:00.000Z")).resolves.toMatchObject({
      creditsRemaining: 300,
    });
    await expect(readCreditBalance({} as never, { type: "user", key: "u-ocr-route-priority" })).resolves.toMatchObject({
      remainingCredits: 50,
    });
  });
});
