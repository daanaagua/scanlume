import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountPanel } from "@/components/account-panel";

const fetchAccountMock = vi.fn();

vi.mock("@/lib/account", () => ({
  fetchAccount: (...args: unknown[]) => fetchAccountMock(...args),
  joinWaitlist: vi.fn(),
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
});

describe("AccountPanel", () => {
  it("shows lifetime credit balance instead of daily usage language", async () => {
    fetchAccountMock.mockResolvedValue({
      viewer: { authenticated: true, user: { id: "u1", email: "jam@scanlume.com", name: "Jam", avatarUrl: null, emailVerified: true, emailVerifiedAt: null, hasPassword: false, authProviders: ["google"] } },
      currentPlan: { id: "free", label: "Conta gratuita", shortLabel: "Gratis", description: "Conta com 50 creditos totais.", priceLabel: "Gratis", isPaid: false, isCurrent: true, comingSoon: false, entitlements: { dailyImages: 100, dailyCredits: 50, maxBatchFiles: 10, maxImageMb: 5, maxBatchTotalMb: 20 }, features: [] },
      usage: { grantedCredits: 50, usedCredits: 0, remainingCredits: 50 },
      usageToday: { usedImages: 0, usedCredits: 0, remainingImages: 100, remainingCredits: 50 },
      billing: { status: "inactive", provider: null, billingEmail: null, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
      waitlist: { joined: false, count: 2, joinedAt: null, canJoin: true },
      availablePlans: [],
      notes: { replyWindow: "", subscriptions: "" },
    });

    render(<AccountPanel />);

    expect(await screen.findByText(/50 creditos restantes/i)).toBeInTheDocument();
    expect(screen.queryByText(/uso de hoje/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/creditos \/ dia/i)).not.toBeInTheDocument();
  });
});
