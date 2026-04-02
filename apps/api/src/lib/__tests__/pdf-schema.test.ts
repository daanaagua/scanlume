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
});
