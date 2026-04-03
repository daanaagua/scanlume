import { act, render, screen, waitFor } from "@testing-library/react";
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

afterEach(() => {
  fetchAccountMock.mockReset();
});

describe("AuthControls", () => {
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
    expect(screen.queryByText(/\/50 hoje/i)).not.toBeInTheDocument();

    await act(async () => {
      announceUsageRefresh();
    });

    await waitFor(() => expect(screen.getByText("47/50 creditos")).toBeInTheDocument());
  });
});
