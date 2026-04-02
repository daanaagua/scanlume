import { describe, expect, it } from "vitest";

import { parsePreparedPagesJson } from "../pdf-ingest";

describe("parsePreparedPagesJson", () => {
  it("maps invalid preparedPages JSON to a structured pdf_invalid error", () => {
    expect(() => parsePreparedPagesJson("not-json")).toThrowError(/pdf_invalid/);
  });
});
