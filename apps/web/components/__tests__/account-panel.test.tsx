import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountPanel } from "@/components/account-panel";
import { clearPurchaseIntent, savePurchaseIntent } from "@/lib/purchase-intent";

const fetchAccountMock = vi.fn();
const joinWaitlistMock = vi.fn();
const createApiKeyMock = vi.fn();
const createBillingCheckoutMock = vi.fn();
const regenerateApiKeyMock = vi.fn();
const revokeApiKeyMock = vi.fn();

vi.mock("@/lib/account", () => ({
  fetchAccount: (...args: unknown[]) => fetchAccountMock(...args),
  joinWaitlist: (...args: unknown[]) => joinWaitlistMock(...args),
  createApiKey: (...args: unknown[]) => createApiKeyMock(...args),
  createBillingCheckout: (...args: unknown[]) => createBillingCheckoutMock(...args),
  regenerateApiKey: (...args: unknown[]) => regenerateApiKeyMock(...args),
  revokeApiKey: (...args: unknown[]) => revokeApiKeyMock(...args),
}));

vi.mock("@/lib/browser-id", () => ({
  getOrCreateBrowserId: () => "browser-123",
}));

vi.mock("@/lib/usage-sync", () => ({
  subscribeUsageRefresh: () => () => {},
}));

afterEach(() => {
  cleanup();
  fetchAccountMock.mockReset();
  joinWaitlistMock.mockReset();
  createApiKeyMock.mockReset();
  createBillingCheckoutMock.mockReset();
  regenerateApiKeyMock.mockReset();
  revokeApiKeyMock.mockReset();
  clearPurchaseIntent();
  window.history.pushState({}, "", "/conta");
});

describe("AccountPanel", () => {
  it("shows lifetime credit balance instead of daily usage language", async () => {
    fetchAccountMock.mockResolvedValue({
      viewer: { authenticated: true, user: { id: "u1", email: "jam@scanlume.com", name: "Jam", avatarUrl: null, emailVerified: true, emailVerifiedAt: null, hasPassword: false, authProviders: ["google"] } },
      currentPlan: { id: "free", label: "Conta gratuita", shortLabel: "Gratis", description: "Conta com 50 creditos totais.", priceLabel: "Gratis", isPaid: false, isCurrent: true, comingSoon: false, entitlements: { dailyImages: 100, dailyCredits: 50, maxBatchFiles: 10, maxImageMb: 5, maxBatchTotalMb: 20 }, features: [] },
      usage: { grantedCredits: 50, usedCredits: 0, remainingCredits: 50 },
      usageToday: { usedImages: 0, usedCredits: 0, remainingImages: 100, remainingCredits: 50 },
      api: {
        remainingCredits: 40000,
        effectiveTier: "growth",
        keys: [{ id: "key_1", label: "build-bot", lastFour: "1a2b", lastUsedAt: null, createdAt: "2026-04-03T00:00:00.000Z" }],
      },
      billing: { status: "inactive", provider: null, billingEmail: null, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
      waitlist: { joined: false, count: 2, joinedAt: null, canJoin: true },
      availablePlans: [],
      notes: { replyWindow: "", subscriptions: "" },
    });

    render(<AccountPanel />);

    expect(await screen.findByText(/50 creditos restantes/i)).toBeInTheDocument();
    expect(screen.getByText(/API credits restantes/i)).toBeInTheDocument();
    expect(screen.getByText(/40.000/i)).toBeInTheDocument();
    expect(screen.queryByText(/uso de hoje/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/creditos \/ dia/i)).not.toBeInTheDocument();
  });

  it("shows a continue-purchase banner when a pending checkout intent exists", async () => {
    window.history.pushState({}, "", "/conta?flow=checkout&product=api_starter");
    savePurchaseIntent({ product: "api_starter", stage: "auth", source: "pricing" });

    fetchAccountMock.mockResolvedValue({
      viewer: { authenticated: true, user: { id: "u1", email: "jam@scanlume.com", name: "Jam", avatarUrl: null, emailVerified: true, emailVerifiedAt: null, hasPassword: false, authProviders: ["google"] } },
      currentPlan: { id: "free", label: "Conta gratuita", shortLabel: "Gratis", description: "Conta com 50 creditos totais.", priceLabel: "Gratis", isPaid: false, isCurrent: true, comingSoon: false, entitlements: { dailyImages: 100, dailyCredits: 50, maxBatchFiles: 10, maxImageMb: 5, maxBatchTotalMb: 20 }, features: [] },
      usage: { grantedCredits: 50, usedCredits: 0, remainingCredits: 50 },
      usageToday: { usedImages: 0, usedCredits: 0, remainingImages: 100, remainingCredits: 50 },
      api: { remainingCredits: 0, effectiveTier: null, keys: [] },
      billing: { status: "inactive", provider: null, billingEmail: null, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
      waitlist: { joined: false, count: 2, joinedAt: null, canJoin: true },
      availablePlans: [],
      notes: { replyWindow: "", subscriptions: "" },
    });

    render(<AccountPanel />);

    expect(await screen.findByText(/Continue sua compra de API Starter/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuar compra/i })).toBeInTheDocument();
  });

  it("shows a first-use success banner when the intended api purchase is already reflected", async () => {
    window.history.pushState({}, "", "/conta?flow=checkout&product=api_growth");
    savePurchaseIntent({ product: "api_growth", stage: "checkout", source: "pricing" });

    fetchAccountMock.mockResolvedValue({
      viewer: { authenticated: true, user: { id: "u1", email: "jam@scanlume.com", name: "Jam", avatarUrl: null, emailVerified: true, emailVerifiedAt: null, hasPassword: false, authProviders: ["google"] } },
      currentPlan: { id: "free", label: "Conta gratuita", shortLabel: "Gratis", description: "Conta com 50 creditos totais.", priceLabel: "Gratis", isPaid: false, isCurrent: true, comingSoon: false, entitlements: { dailyImages: 100, dailyCredits: 50, maxBatchFiles: 10, maxImageMb: 5, maxBatchTotalMb: 20 }, features: [] },
      usage: { grantedCredits: 50, usedCredits: 0, remainingCredits: 50 },
      usageToday: { usedImages: 0, usedCredits: 0, remainingImages: 100, remainingCredits: 50 },
      api: { remainingCredits: 40000, effectiveTier: "growth", keys: [] },
      billing: { status: "inactive", provider: null, billingEmail: null, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
      waitlist: { joined: false, count: 2, joinedAt: null, canJoin: true },
      availablePlans: [],
      notes: { replyWindow: "", subscriptions: "" },
    });

    render(<AccountPanel />);

    expect(await screen.findByText(/Compra confirmada para API Growth/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir documentacao da API/i })).toBeInTheDocument();
  });
});
