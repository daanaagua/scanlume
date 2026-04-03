import { describe, expect, it } from "vitest";

import { readApiBalance } from "../api-usage";
import { createApiJob, readApiJob, updateApiJobResult } from "../api-jobs";
import { writeApiCreditPack } from "../store";

describe("api usage", () => {
  it("aggregates multiple API packs into one visible balance", async () => {
    await writeApiCreditPack({} as never, {
      id: "pack-1",
      userId: "u1",
      tier: "starter",
      creditsTotal: 10000,
      creditsRemaining: 10000,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2027-01-01T00:00:00.000Z",
    });
    await writeApiCreditPack({} as never, {
      id: "pack-2",
      userId: "u1",
      tier: "growth",
      creditsTotal: 40000,
      creditsRemaining: 40000,
      purchasedAt: "2026-04-03T00:00:00.000Z",
      expiresAt: "2027-06-01T00:00:00.000Z",
    });

    await expect(readApiBalance({} as never, "u1")).resolves.toMatchObject({
      remainingCredits: 50000,
      effectiveTier: "growth",
    });
  });

  it("persists PDF API jobs with page-level billing state", async () => {
    await createApiJob({} as never, {
      id: "job-1",
      userId: "u1",
      kind: "pdf_ocr",
      status: "queued",
      payload: { fileName: "sample.pdf" },
    });

    await updateApiJobResult({} as never, {
      id: "job-1",
      status: "completed",
      processedPages: 2,
      failedPages: 1,
      creditsCharged: 4,
    });

    await expect(readApiJob({} as never, "job-1")).resolves.toMatchObject({
      status: "completed",
      processedPages: 2,
      failedPages: 1,
      creditsCharged: 4,
    });
  });
});
