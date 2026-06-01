import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthControls } from "@/components/auth-controls";
import { announceUsageRefresh } from "@/lib/usage-sync";

const fetchAccountMock = vi.fn();

vi.mock("@/lib/account", () => ({
  fetchAccount: (...args: unknown[]) => fetchAccountMock(...args),
  joinWaitlist: vi.fn(),
}));

vi.mock("@/lib/browser-id", () => ({
  getOrCreateBrowserId: () => "browser-123",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

afterEach(() => {
  cleanup();
  fetchAccountMock.mockReset();
});

describe("AuthControls", () => {
  it("uses a single accessible label for the anonymous login button", async () => {
    fetchAccountMock.mockResolvedValueOnce({
      viewer: { authenticated: false, user: null },
      currentPlan: { id: "anonymous", label: "Teste gratis", shortLabel: "Teste", description: "", priceLabel: "Gratis", isPaid: false, isCurrent: true, comingSoon: false, entitlements: { dailyImages: 5, dailyCredits: 5, maxBatchFiles: 3, maxImageMb: 5, maxBatchTotalMb: 10 }, features: [] },
      usage: { grantedCredits: 5, usedCredits: 0, remainingCredits: 5 },
      usageToday: { usedImages: 0, usedCredits: 0, remainingImages: 5, remainingCredits: 5 },
      billing: { status: "inactive", provider: null, billingEmail: null, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
      waitlist: { joined: false, count: 0, joinedAt: null, canJoin: true },
      availablePlans: [],
      notes: { replyWindow: "", subscriptions: "" },
    });

    render(<AuthControls />);

    const loginButton = await screen.findByRole("button", { name: "Entrar" });

    expect(loginButton).toHaveTextContent(/^Entrar$/);
  });

  it("uses English account copy when rendered for English pages", async () => {
    fetchAccountMock.mockResolvedValueOnce({
      viewer: { authenticated: false, user: null },
      currentPlan: { id: "anonymous", label: "Free trial", shortLabel: "Trial", description: "", priceLabel: "Free", isPaid: false, isCurrent: true, comingSoon: false, entitlements: { dailyImages: 5, dailyCredits: 5, maxBatchFiles: 3, maxImageMb: 5, maxBatchTotalMb: 10 }, features: [] },
      usage: { grantedCredits: 5, usedCredits: 0, remainingCredits: 5 },
      usageToday: { usedImages: 0, usedCredits: 0, remainingImages: 5, remainingCredits: 5 },
      billing: { status: "inactive", provider: null, billingEmail: null, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
      waitlist: { joined: false, count: 0, joinedAt: null, canJoin: true },
      availablePlans: [],
      notes: { replyWindow: "", subscriptions: "" },
    });

    render(<AuthControls locale="en" />);

    const loginButton = await screen.findByRole("button", { name: "Sign in" });

    expect(loginButton).toHaveTextContent(/^Sign in$/);
    expect(screen.queryByRole("button", { name: "Entrar" })).not.toBeInTheDocument();
  });

  it("passes English copy into the login dialog", async () => {
    fetchAccountMock.mockResolvedValueOnce({
      viewer: { authenticated: false, user: null },
      currentPlan: { id: "anonymous", label: "Free trial", shortLabel: "Trial", description: "", priceLabel: "Free", isPaid: false, isCurrent: true, comingSoon: false, entitlements: { dailyImages: 5, dailyCredits: 5, maxBatchFiles: 3, maxImageMb: 5, maxBatchTotalMb: 10 }, features: [] },
      usage: { grantedCredits: 5, usedCredits: 0, remainingCredits: 5 },
      usageToday: { usedImages: 0, usedCredits: 0, remainingImages: 5, remainingCredits: 5 },
      billing: { status: "inactive", provider: null, billingEmail: null, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
      waitlist: { joined: false, count: 0, joinedAt: null, canJoin: true },
      availablePlans: [],
      notes: { replyWindow: "", subscriptions: "" },
    });

    render(<AuthControls locale="en" />);

    await screen.findByRole("button", { name: "Sign in" });
    screen.getByRole("button", { name: "Sign in" }).click();

    expect(await screen.findByRole("heading", { name: "Sign in to your account" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
  });

  it("refreshes visible usage after a usage-refresh event", async () => {
    fetchAccountMock
      .mockResolvedValueOnce({
        viewer: { authenticated: true, user: { id: "u1", email: "jam@scanlume.com", name: "Jam", avatarUrl: null, emailVerified: true, emailVerifiedAt: null, hasPassword: false, authProviders: ["google"] } },
        currentPlan: { id: "free", label: "Conta gratuita", shortLabel: "Gratis", description: "", priceLabel: "Gratis", isPaid: false, isCurrent: true, comingSoon: false, entitlements: { dailyImages: 100, dailyCredits: 50, maxBatchFiles: 10, maxImageMb: 5, maxBatchTotalMb: 20 }, features: [] },
        usage: { grantedCredits: 50, usedCredits: 0, remainingCredits: 50 },
        usageToday: { usedImages: 0, usedCredits: 0, remainingImages: 100, remainingCredits: 100 },
        billing: { status: "inactive", provider: null, billingEmail: null, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
        waitlist: { joined: true, count: 2, joinedAt: null, canJoin: false },
        availablePlans: [],
        notes: { replyWindow: "", subscriptions: "" },
      })
      .mockResolvedValueOnce({
        viewer: { authenticated: true, user: { id: "u1", email: "jam@scanlume.com", name: "Jam", avatarUrl: null, emailVerified: true, emailVerifiedAt: null, hasPassword: false, authProviders: ["google"] } },
        currentPlan: { id: "free", label: "Conta gratuita", shortLabel: "Gratis", description: "", priceLabel: "Gratis", isPaid: false, isCurrent: true, comingSoon: false, entitlements: { dailyImages: 100, dailyCredits: 50, maxBatchFiles: 10, maxImageMb: 5, maxBatchTotalMb: 20 }, features: [] },
        usage: { grantedCredits: 50, usedCredits: 3, remainingCredits: 47 },
        usageToday: { usedImages: 1, usedCredits: 3, remainingImages: 99, remainingCredits: 97 },
        billing: { status: "inactive", provider: null, billingEmail: null, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
        waitlist: { joined: true, count: 2, joinedAt: null, canJoin: false },
        availablePlans: [],
        notes: { replyWindow: "", subscriptions: "" },
      });

    render(<AuthControls />);

    await screen.findByText("50/50 creditos");
    expect(screen.queryByRole("button", { name: /Na lista|Entrar na lista/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/\/50 hoje/i)).not.toBeInTheDocument();

    await act(async () => {
      announceUsageRefresh();
    });

    await waitFor(() => expect(screen.getByText("47/50 creditos")).toBeInTheDocument());
  });
});
