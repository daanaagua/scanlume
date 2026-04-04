import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteHeader } from "@/components/site-header";

vi.mock("@/components/auth-controls", () => ({
  AuthControls: () => <div data-testid="auth-controls" />,
}));

describe("SiteHeader", () => {
  it("shows a prominent pricing badge that links directly to /precos", () => {
    render(<SiteHeader />);

    const priceText = screen.getByText(/desde \$5/i);
    expect(priceText).toBeInTheDocument();
    expect(priceText.closest("a")).toHaveAttribute("href", "/precos");
    expect(screen.getByText(/ver precos/i)).toBeInTheDocument();
  });
});
