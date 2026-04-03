import { describe, expect, it } from "vitest";

import app from "../../index";
import { grantApiPack } from "../api-usage";

function createUserRequest(path: string, init?: RequestInit) {
  return new Request(`https://api.scanlume.com${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-test-user-id": "u1",
      ...(init?.headers ?? {}),
    },
  });
}

describe("API key routes", () => {
  it("creates and lists API keys for an entitled account", async () => {
    await grantApiPack({} as never, {
      id: "pack-route-1",
      userId: "u1",
      tier: "starter",
      creditsTotal: 10000,
      creditsRemaining: 10000,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2027-04-03T00:00:00.000Z",
    });

    const created = await app.fetch(
      createUserRequest("/v1/api/keys", {
        method: "POST",
        body: JSON.stringify({ label: "build-bot" }),
      }),
      {} as never,
    );
    expect(created.status).toBe(201);

    const listed = await app.fetch(createUserRequest("/v1/api/keys"), {} as never);
    expect(listed.status).toBe(200);
    expect(await listed.json()).toMatchObject({ keys: [{ label: "build-bot", lastFour: expect.any(String) }] });
  });

  it("returns API balances and key summaries inside /v1/account", async () => {
    const response = await app.fetch(createUserRequest("/v1/account"), {} as never);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ api: { remainingCredits: expect.any(Number), keys: expect.any(Array) } });
  });
});
