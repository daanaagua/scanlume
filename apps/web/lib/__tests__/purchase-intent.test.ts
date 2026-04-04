import { afterEach, describe, expect, it } from "vitest";

import { clearPurchaseIntent, readPurchaseIntent, savePurchaseIntent } from "@/lib/purchase-intent";

describe("purchase intent", () => {
  afterEach(() => {
    clearPurchaseIntent();
  });

  it("stores and retrieves the selected product intent", () => {
    savePurchaseIntent({ product: "api_starter", stage: "auth", source: "pricing" });

    expect(readPurchaseIntent()).toMatchObject({
      product: "api_starter",
      stage: "auth",
      source: "pricing",
    });
  });

  it("clears the persisted purchase intent", () => {
    savePurchaseIntent({ product: "web_starter_monthly", stage: "checkout", source: "pricing" });
    clearPurchaseIntent();

    expect(readPurchaseIntent()).toBeNull();
  });
});
