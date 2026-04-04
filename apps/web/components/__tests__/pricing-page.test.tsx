import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PricingPage } from "@/components/pricing-page";

const fetchAccountMock = vi.fn();

function createAccountResponse(overrides: Record<string, unknown> = {}) {
  return {
    viewer: { authenticated: false, user: null },
    currentPlan: { id: "free", label: "Conta gratuita", shortLabel: "Gratis", description: "", priceLabel: "Gratis", isPaid: false, isCurrent: true, comingSoon: false, entitlements: { dailyImages: 100, dailyCredits: 50, maxBatchFiles: 10, maxImageMb: 5, maxBatchTotalMb: 20 }, features: [] },
    usage: { grantedCredits: 50, usedCredits: 0, remainingCredits: 50 },
    usageToday: { usedImages: 0, usedCredits: 0, remainingImages: 100, remainingCredits: 50 },
    billing: { status: "inactive", provider: null, billingEmail: null, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
    waitlist: { joined: false, count: 2, joinedAt: null, canJoin: true },
    availablePlans: [],
    notes: { replyWindow: "", subscriptions: "" },
    api: { remainingCredits: 0, effectiveTier: null, keys: [] },
    ...overrides,
  };
}

vi.mock("@/lib/account", async () => {
  const actual = await vi.importActual<typeof import("@/lib/account")>("@/lib/account");

  return {
    ...actual,
    fetchAccount: (...args: unknown[]) => fetchAccountMock(...args),
  };
});

vi.mock("@/lib/browser-id", () => ({
  getOrCreateBrowserId: () => "browser-123",
}));

afterEach(() => {
  cleanup();
  fetchAccountMock.mockReset();
});

describe("PricingPage", () => {
  it("shows Starter, Pro, and Business web plans with approved monthly and annual prices", () => {
    fetchAccountMock.mockResolvedValue(createAccountResponse());
    render(<PricingPage />);

    expect(screen.getByRole("button", { name: "Web" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "API" })).toBeInTheDocument();
    expect(screen.getByText("$5 / mes")).toBeInTheDocument();
    expect(screen.getByText("$9 / mes")).toBeInTheDocument();
    expect(screen.getByText("$24 / mes")).toBeInTheDocument();
    expect(screen.getByText(/Plano anual: \$48 \/ ano/i)).toBeInTheDocument();
    expect(screen.getByText(/Plano anual: \$82 \/ ano/i)).toBeInTheDocument();
    expect(screen.getByText(/Plano anual: \$228 \/ ano/i)).toBeInTheDocument();
  });

  it("switches between vertical web and api pricing stacks", async () => {
    fetchAccountMock.mockResolvedValue(createAccountResponse());
    render(<PricingPage />);
    const user = userEvent.setup();

    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getAllByText(/Included features/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("list").length).toBeGreaterThan(0);
    expect(screen.queryByText("API Starter")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /assinar/i }).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/Mais escolhido/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "API" }));

    expect(screen.getByText("API Starter")).toBeInTheDocument();
    expect(screen.getByText("API Growth")).toBeInTheDocument();
    expect(screen.getByText("API Scale")).toBeInTheDocument();
    expect(screen.getAllByText(/Included features/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Assinar mensal/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Comprar API pack/i }).length).toBeGreaterThan(0);
  });

  it("shows code tabs, billing disclosures, and API commercial fields", async () => {
    fetchAccountMock.mockResolvedValue(createAccountResponse());
    render(<PricingPage />);
    const user = userEvent.setup();

    expect(screen.getByRole("tab", { name: "cURL" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "JavaScript" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Python" })).toBeInTheDocument();
    expect(screen.getByText(/nao rolam para o proximo periodo/i)).toBeInTheDocument();
    expect(screen.getByText(/API credits sao separados dos web credits/i)).toBeInTheDocument();
    expect(screen.getByText(/Simple OCR = 1 credit/i)).toBeInTheDocument();
    expect(screen.getByText(/Formatted OCR = 2 credits/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF OCR = 2 credits/i)).toBeInTheDocument();
    expect(screen.getByText(/1 formatted OCR image costs only 2 credits on Scanlume/i)).toBeInTheDocument();
    expect(screen.getByText(/--data @-/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "API" }));
    expect(screen.getByText(/60 RPM/i)).toBeInTheDocument();
    expect(screen.getAllByText(/base64 data url/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Enterprise/i)).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "JavaScript" }));
    expect(screen.getByText(/readFile/i)).toBeInTheDocument();
    expect(screen.getByText(/data:image\/png;base64/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Python" }));
    expect(screen.getByText(/base64\.b64encode/i)).toBeInTheDocument();
    expect(screen.getByText(/print\(data\["result"\]\["txt"\]\)/i)).toBeInTheDocument();
  });

  it("matches the Business card to the authenticated Business subscriber", async () => {
    fetchAccountMock.mockResolvedValue(createAccountResponse({
      viewer: { authenticated: true, user: { id: "u1", email: "jam@scanlume.com", name: "Jam", avatarUrl: null, emailVerified: true, emailVerifiedAt: null, hasPassword: false, authProviders: ["google"] } },
      currentPlan: { id: "business", label: "Business", shortLabel: "Business", description: "", priceLabel: "$24 / mes", isPaid: true, isCurrent: true, comingSoon: false, entitlements: { dailyImages: 99999, dailyCredits: 60000, maxBatchFiles: 80, maxImageMb: 30, maxBatchTotalMb: 120 }, features: [] },
      usage: { grantedCredits: 60000, usedCredits: 1, remainingCredits: 59999 },
      usageToday: { usedImages: 1, usedCredits: 1, remainingImages: 99998, remainingCredits: 59999 },
      billing: { status: "active", provider: "creem", billingEmail: "jam@scanlume.com", currentPeriodStart: "2026-04-01T00:00:00.000Z", currentPeriodEnd: "2026-05-01T00:00:00.000Z", cancelAtPeriodEnd: false },
      waitlist: { joined: true, count: 2, joinedAt: null, canJoin: false },
    }));

    render(<PricingPage />);

    const businessCard = screen.getByRole("heading", { name: "Business" }).closest("article");
    expect(businessCard).not.toBeNull();

    await waitFor(() => {
      expect(within(businessCard as HTMLElement).getAllByText(/Plano atual/i).length).toBeGreaterThan(0);
    });
    expect(within(businessCard as HTMLElement).queryByRole("button", { name: /Assinar mensal/i })).not.toBeInTheDocument();
    expect(within(businessCard as HTMLElement).queryByRole("button", { name: /Assinar anual/i })).not.toBeInTheDocument();
  });

  it("holds checkout CTAs until the account lookup finishes", () => {
    fetchAccountMock.mockImplementation(() => new Promise(() => {}));

    render(<PricingPage />);

    expect(screen.queryByRole("button", { name: /Assinar mensal/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Assinar anual/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Verificando plano/i).length).toBeGreaterThan(0);
  });
});
