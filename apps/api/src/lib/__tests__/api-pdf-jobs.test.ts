import { describe, expect, it } from "vitest";

import app from "../../index";
import { createApiKey } from "../api-auth";
import { updateApiJobResult } from "../api-jobs";
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
  it("creates a PDF beta job without pre-charging credits", async () => {
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

    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ status: "queued", credits_charged: 0, billing_mode: "settle_on_completion" });
  });

  it("settles a completed PDF beta job on successful processed pages only", async () => {
    await grantApiPack({} as never, {
      id: "pack-pdf-job-2",
      userId: "u2",
      tier: "starter",
      creditsTotal: 10000,
      creditsRemaining: 10000,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2027-04-03T00:00:00.000Z",
    });
    const key = await createApiKey({} as never, { userId: "u2", label: "pdf-2" });
    const created = await app.fetch(createApiRequest(key.secret, "/v1/api/pdf/jobs", {
      method: "POST",
      body: JSON.stringify({ fileName: "sample.pdf", totalPages: 3 }),
    }), {} as never);
    const createdPayload = await created.json();

    await updateApiJobResult({} as never, {
      id: createdPayload.job_id,
      status: "completed",
      processedPages: 2,
      failedPages: 1,
      creditsCharged: 4,
    });

    const statusResponse = await app.fetch(createApiRequest(key.secret, `/v1/api/jobs/${createdPayload.job_id}`), {} as never);
    expect(statusResponse.status).toBe(200);
    expect(await statusResponse.json()).toMatchObject({ status: "completed", credits_charged: 4, processed_pages: 2, failed_pages: 1 });
  });
});
