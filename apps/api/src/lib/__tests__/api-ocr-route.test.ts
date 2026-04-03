import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../../index";
import { createApiKey } from "../api-auth";
import { grantApiPack } from "../api-usage";

function createApiRequest(secret: string, body: Record<string, unknown>) {
  return new Request("https://api.scanlume.com/v1/api/ocr", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("image OCR API route", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns OCR result plus billing metadata for image API", async () => {
    await grantApiPack({} as never, {
      id: "pack-api-ocr-1",
      userId: "u1",
      tier: "starter",
      creditsTotal: 10000,
      creditsRemaining: 10000,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2027-04-03T00:00:00.000Z",
    });
    const key = await createApiKey({} as never, { userId: "u1", label: "ocr" });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ output_text: "hello", usage: { input_tokens: 0, output_tokens: 0 } }), { status: 200 }));

    const response = await app.fetch(createApiRequest(key.secret, { mode: "simple", base64: "data:image/png;base64,ZmFrZQ==" }), {
      ARK_API_BASE: "https://ark.test",
      ARK_MODEL: "mock-model",
      ARK_API_KEY: "mock-key",
    } as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ request_id: expect.any(String), credits_charged: 1, remaining_credits: 9999, plan: "starter", status: "success" });
  });

  it("returns 401 for invalid API keys", async () => {
    const response = await app.fetch(createApiRequest("bogus", { mode: "simple", base64: "data:image/png;base64,ZmFrZQ==" }), {
      ARK_API_BASE: "https://ark.test",
      ARK_MODEL: "mock-model",
      ARK_API_KEY: "mock-key",
    } as never);

    expect(response.status).toBe(401);
  });
});
