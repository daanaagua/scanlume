import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiKeyPanel } from "@/components/api-key-panel";

describe("ApiKeyPanel", () => {
  it("renders API pack expiry hints and key actions when API entitlement exists", () => {
    render(
      <ApiKeyPanel
        api={{
          remainingCredits: 40000,
          effectiveTier: "growth",
          keys: [{ id: "key_1", label: "build-bot", lastFour: "1a2b", lastUsedAt: null, createdAt: "2026-04-03T00:00:00.000Z" }],
          packs: [{ id: "pack_1", tier: "growth", creditsRemaining: 40000, expiresAt: "2027-04-03T00:00:00.000Z" }],
        }}
        onCreateKey={vi.fn()}
        onRegenerateKey={vi.fn()}
        onRevokeKey={vi.fn()}
      />,
    );

    expect(screen.getByText(/expira em/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Criar API key/i })).toBeInTheDocument();
    expect(screen.getByText(/build-bot/i)).toBeInTheDocument();
  });
});
