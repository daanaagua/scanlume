import { describe, expect, it } from "vitest";

import { createApiKey, checkApiRateLimit, regenerateApiKey } from "../api-auth";
import { grantApiPack } from "../api-usage";

describe("api auth", () => {
  it("allows API-only accounts with active API packs to create up to 3 keys", async () => {
    await grantApiPack({} as never, {
      id: "pack-auth-1",
      userId: "u1",
      tier: "starter",
      creditsTotal: 10000,
      creditsRemaining: 10000,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2027-04-03T00:00:00.000Z",
    });

    await expect(createApiKey({} as never, { userId: "u1", label: "build-bot" })).resolves.toMatchObject({
      lastFour: expect.any(String),
    });
  });

  it("returns per-key and per-account RPM for the effective tier", async () => {
    const decision = await checkApiRateLimit({} as never, {
      userId: "u1",
      apiKeyId: "key-1",
      effectiveTier: "growth",
    });

    expect(decision).toMatchObject({
      perKeyRpm: 90,
      accountAggregateRpm: 180,
    });
  });

  it("regenerates an API key while preserving the key id", async () => {
    await grantApiPack({} as never, {
      id: "pack-auth-2",
      userId: "u2",
      tier: "starter",
      creditsTotal: 10000,
      creditsRemaining: 10000,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2027-04-03T00:00:00.000Z",
    });
    const created = await createApiKey({} as never, { userId: "u2", label: "deploy" });
    const regenerated = await regenerateApiKey({} as never, { userId: "u2", keyId: created.id });

    expect(regenerated).toMatchObject({ id: created.id, lastFour: expect.any(String) });
    expect(regenerated.secret).not.toBe(created.secret);
  });
});
