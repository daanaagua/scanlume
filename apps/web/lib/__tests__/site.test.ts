import { describe, expect, it } from "vitest";

import { API_BASE_URL } from "@/lib/site";

describe("API_BASE_URL", () => {
  it("defaults to the production API origin when NEXT_PUBLIC_API_BASE_URL is unset", () => {
    expect(API_BASE_URL).toBe("https://api.scanlume.com");
  });
});
