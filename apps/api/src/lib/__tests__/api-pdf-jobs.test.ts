import { describe, expect, it } from "vitest";

import app from "../../index";
import { createApiKey } from "../api-auth";
import { grantApiPack } from "../api-usage";

function createApiRequest(secret: string, path: string, init?: RequestInit) {
  return new Request(`https://api.scanlume.com${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

describe("PDF beta API jobs", () => {
  it("returns a beta waitlist response for PDF API", async () => {
    await grantApiPack({} as never, {
      id: "pack-pdf-job-1",
      userId: "u1",
      tier: "starter",
      creditsTotal: 10000,
      creditsRemaining: 10000,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2027-04-03T00:00:00.000Z",
    });
    const key = await createApiKey({} as never, { userId: "u1", label: "pdf" });

    const response = await app.fetch(createApiRequest(key.secret, "/v1/api/pdf/jobs", {
      method: "POST",
      body: JSON.stringify({ fileName: "sample.pdf", totalPages: 3 }),
    }), {} as never);

    expect(response.status).toBe(501);
    expect(await response.json()).toMatchObject({ code: "pdf_api_beta_waitlist" });
  });
});
