import { describe, expect, it } from "vitest";

import { buildPdfPageResult, orderRegionsForReading } from "../pdf-segmentation";

describe("orderRegionsForReading", () => {
  it("keeps full-width content before lower two-column content", () => {
    const ordered = orderRegionsForReading([
      { id: "left", top: 400, left: 0, width: 250, lane: "left" },
      { id: "hero-image", top: 180, left: 0, width: 520, lane: "full" },
      { id: "intro", top: 40, left: 0, width: 520, lane: "full" },
      { id: "right", top: 400, left: 270, width: 250, lane: "right" },
    ]);

    expect(ordered.map((item) => item.id)).toEqual(["intro", "hero-image", "left", "right"]);
  });
});

describe("buildPdfPageResult", () => {
  it("omits text fields for failed pages", () => {
    const page = buildPdfPageResult({
      pageNumber: 4,
      status: "failed",
      source: "ocr",
      width: 100,
      height: 200,
      errorCode: "ocr_failed",
      errorMessage: "bad page",
    });

    expect(page.text).toBeUndefined();
    expect(page.errorCode).toBe("ocr_failed");
  });
});
