import { beforeEach, describe, expect, it } from "vitest";

describe("buildPdfAllowance", () => {
  beforeEach(() => {
    delete (globalThis as { __pdfLocks?: Set<string> }).__pdfLocks;
  });

  it("returns real metadata and upsell details when remaining credits are exhausted", async () => {
    const { buildPdfAllowance } = await import("../pdf-limits");

    const result = buildPdfAllowance({
      viewerType: "user",
      totalPages: 30,
      remainingCredits: 0,
      maxPagesPerDocument: 50,
    } as never);

    expect(result).toMatchObject({
      processablePages: 0,
      lockedPages: 30,
      billingUpsell: {
        required: true,
        ctaHref: "/conta",
      },
    });
  });

  it("derives processable pages from floor(remainingCredits / 2)", async () => {
    const { buildPdfAllowance } = await import("../pdf-limits");

    const result = buildPdfAllowance({
      viewerType: "user",
      totalPages: 6,
      remainingCredits: 3,
      maxPagesPerDocument: 50,
    } as never);

    expect(result).toMatchObject({
      processablePages: 1,
      lockedPages: 5,
      truncated: true,
    });
  });

  it("counts only success and partial pages as billable", async () => {
    const { countBillablePdfPages } = await import("../pdf-limits");

    expect(
      countBillablePdfPages([
        { status: "success" },
        { status: "partial" },
        { status: "failed" },
      ]),
    ).toBe(2);
  });

  it("rejects a second active job for the same logged-in user", async () => {
    const { acquirePdfProcessingLock } = await import("../pdf-limits");

    await expect(acquirePdfProcessingLock({ lockKey: "user-123" })).resolves.toBeTruthy();
    await expect(acquirePdfProcessingLock({ lockKey: "user-123" })).rejects.toMatchObject({
      status: 409,
      code: "pdf_job_in_progress",
    });
  });
});
