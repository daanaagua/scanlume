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

function createAccountResponse(overrides: Record<string, unknown> = {}) {
  return {
    viewer: {
      authenticated: true,
      user: {
        id: "u1",
        email: "jam@scanlume.com",
        name: "Jam",
        avatarUrl: null,
        emailVerified: true,
        emailVerifiedAt: null,
        hasPassword: false,
        authProviders: ["google"],
      },
    },
    currentPlan: {
      id: "free",
      label: "Conta gratuita",
      shortLabel: "Gratis",
      description: "Conta com 50 creditos totais.",
      priceLabel: "Gratis",
      isPaid: false,
      isCurrent: true,
      comingSoon: false,
      entitlements: { dailyImages: 100, dailyCredits: 50, maxBatchFiles: 10, maxImageMb: 5, maxBatchTotalMb: 20 },
      features: [],
    },
    usage: { grantedCredits: 50, usedCredits: 0, remainingCredits: 50 },
    usageToday: { usedImages: 0, usedCredits: 0, remainingImages: 100, remainingCredits: 50 },
    api: {
      remainingCredits: 0,
      effectiveTier: null,
      keys: [],
    },
    billing: { status: "inactive", provider: null, billingEmail: null, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
    webExperience: {
      status: "available",
      canPurchase: true,
      hasPurchased: false,
      creditsTotal: null,
      creditsRemaining: null,
      expiresAt: null,
    },
    waitlist: { joined: false, count: 2, joinedAt: null, canJoin: true },
    availablePlans: [],
    notes: { replyWindow: "Suporte responde em ate 24h.", subscriptions: "Pagamentos ja estao abertos para web e API." },
    ...overrides,
  };
}

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
    fetchAccountMock.mockResolvedValue(createAccountResponse({
      api: {
        remainingCredits: 40000,
        effectiveTier: "growth",
        keys: [{ id: "key_1", label: "build-bot", lastFour: "1a2b", lastUsedAt: null, createdAt: "2026-04-03T00:00:00.000Z" }],
      },
    }));

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

    fetchAccountMock.mockResolvedValue(createAccountResponse());

    render(<AccountPanel />);

    expect(await screen.findByText(/Continue sua compra de API Starter/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuar compra/i })).toBeInTheDocument();
  });

  it("shows a first-use success banner when the intended api purchase is already reflected", async () => {
    window.history.pushState({}, "", "/conta?flow=checkout&product=api_growth");
    savePurchaseIntent({ product: "api_growth", stage: "checkout", source: "pricing" });

    fetchAccountMock.mockResolvedValue(createAccountResponse({
      api: { remainingCredits: 40000, effectiveTier: "growth", keys: [] },
    }));

    render(<AccountPanel />);

    expect(await screen.findByText(/Compra confirmada para API Growth/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir documentacao da API/i })).toBeInTheDocument();
  });

  it("replaces waitlist copy with live-payment messaging and the available web experience CTA", async () => {
    fetchAccountMock.mockResolvedValue(createAccountResponse());

    render(<AccountPanel />);

    expect(await screen.findByText(/Pagamentos ja estao abertos para web e API/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Comprar experiencia web por \$1/i })).toBeInTheDocument();
    expect(screen.queryByText(/Versao paga de abril/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/lista de espera/i)).not.toBeInTheDocument();
  });

  it("shows active web experience balance and OCR CTA", async () => {
    fetchAccountMock.mockResolvedValue(createAccountResponse({
      webExperience: {
        status: "active",
        canPurchase: false,
        hasPurchased: true,
        creditsTotal: 300,
        creditsRemaining: 225,
        expiresAt: "2026-05-10T00:00:00.000Z",
      },
    }));

    render(<AccountPanel />);

    expect(await screen.findByText(/Web Experience ativa/i)).toBeInTheDocument();
    expect(screen.getByText(/225 de 300 credits restantes/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ir para OCR/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Comprar experiencia web por \$1/i })).not.toBeInTheDocument();
  });

  it("shows consumed and expired web experience states without reopening purchase", async () => {
    fetchAccountMock.mockResolvedValueOnce(createAccountResponse({
      webExperience: {
        status: "consumed",
        canPurchase: false,
        hasPurchased: true,
        creditsTotal: 300,
        creditsRemaining: 0,
        expiresAt: "2026-05-10T00:00:00.000Z",
      },
    }));

    const consumedView = render(<AccountPanel />);

    expect(await screen.findByText(/Web Experience consumida/i)).toBeInTheDocument();
    expect(screen.getByText(/Todos os 300 credits ja foram usados/i)).toBeInTheDocument();
    expect(screen.getByText(/A oferta era valida uma unica vez/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Comprar experiencia web por \$1/i })).not.toBeInTheDocument();

    consumedView.unmount();

    fetchAccountMock.mockResolvedValueOnce(createAccountResponse({
      webExperience: {
        status: "expired",
        canPurchase: false,
        hasPurchased: true,
        creditsTotal: 300,
        creditsRemaining: 75,
        expiresAt: "2026-05-10T00:00:00.000Z",
      },
    }));

    render(<AccountPanel />);

    expect(await screen.findByText(/Web Experience expirada/i)).toBeInTheDocument();
    expect(screen.getByText(/Sua janela da oferta terminou/i)).toBeInTheDocument();
    expect(screen.getByText(/A oferta era valida uma unica vez/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Comprar experiencia web por \$1/i })).not.toBeInTheDocument();
  });

  it("shows the paid-plan-active state when the web experience does not apply", async () => {
    fetchAccountMock.mockResolvedValue(createAccountResponse({
      currentPlan: {
        id: "starter",
        label: "Starter",
        shortLabel: "Starter",
        description: "Plano mensal ativo.",
        priceLabel: "$5 / mes",
        isPaid: true,
        isCurrent: true,
        comingSoon: false,
        entitlements: { dailyImages: 99999, dailyCredits: 8000, maxBatchFiles: 30, maxImageMb: 20, maxBatchTotalMb: 40 },
        features: [],
      },
      billing: { status: "active", provider: "creem", billingEmail: "jam@scanlume.com", currentPeriodStart: "2026-04-01T00:00:00.000Z", currentPeriodEnd: "2026-05-01T00:00:00.000Z", cancelAtPeriodEnd: false },
      webExperience: {
        status: "paid_plan_active",
        canPurchase: false,
        hasPurchased: false,
        creditsTotal: null,
        creditsRemaining: null,
        expiresAt: null,
      },
    }));

    render(<AccountPanel />);

    expect(await screen.findByText(/Web Experience nao se aplica ao seu plano atual/i)).toBeInTheDocument();
    expect(screen.getByText(/Sua assinatura paga ja cobre o uso web/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Comprar experiencia web por \$1/i })).not.toBeInTheDocument();
  });

  it("shows the web experience purchase success banner when the paid offer lands", async () => {
    window.history.pushState({}, "", "/conta?flow=checkout&product=web_experience_onetime");
    savePurchaseIntent({ product: "web_experience_onetime", stage: "checkout", source: "pricing" });

    fetchAccountMock.mockResolvedValue(createAccountResponse({
      webExperience: {
        status: "active",
        canPurchase: false,
        hasPurchased: true,
        creditsTotal: 300,
        creditsRemaining: 300,
        expiresAt: "2026-05-10T00:00:00.000Z",
      },
    }));

    render(<AccountPanel />);

    expect(await screen.findByText(/Compra confirmada para Web Experience/i)).toBeInTheDocument();
    expect(screen.getByText(/300 credits ja estao disponiveis/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir OCR agora/i })).toBeInTheDocument();
  });
});
