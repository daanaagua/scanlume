import { describe, expect, it } from "vitest";

describe("pdf OCR contract", () => {
  it("rejects requests without the required multipart metadata fields", async () => {
    const { pdfOcrUploadSchema } = await import("../pdf-schema");

    const parsed = pdfOcrUploadSchema.safeParse({
      file: undefined,
      browserId: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("parses the stable pdf limits snapshot used by the web workspace", async () => {
    const { pdfLimitSnapshotSchema } = await import("../pdf-schema");

    expect(
      pdfLimitSnapshotSchema.parse({
        maxFileMb: 15,
        maxPagesPerDocument: 50,
        requestPageLimitAnonymous: 5,
        dailyPageLimitLoggedIn: 20,
        remainingPages: 12,
      }),
    ).toBeTruthy();
  });
});
