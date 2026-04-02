import { describe, expect, it } from "vitest";

import { getBlogPost } from "@/lib/blog";

describe("blog release notes", () => {
  it("contains the PDF layout reconstruction release post with links back to PDF routes", () => {
    expect(getBlogPost("pdf-layout-reconstruction-update")?.relatedLinks).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: "/pdf-para-texto" })]),
    );
  });
});
