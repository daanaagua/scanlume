export type PurchaseIntent = {
  product: string;
  source: "pricing" | "account";
  stage: "auth" | "checkout";
  updatedAt: string;
};

const STORAGE_KEY = "scanlume.purchase-intent.v1";

export function savePurchaseIntent(input: Omit<PurchaseIntent, "updatedAt">) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...input,
      updatedAt: new Date().toISOString(),
    } satisfies PurchaseIntent),
  );
}

export function readPurchaseIntent() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PurchaseIntent>;
    if (
      typeof parsed.product !== "string"
      || (parsed.source !== "pricing" && parsed.source !== "account")
      || (parsed.stage !== "auth" && parsed.stage !== "checkout")
      || typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }

    return parsed as PurchaseIntent;
  } catch {
    return null;
  }
}

export function clearPurchaseIntent() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(STORAGE_KEY);
}
