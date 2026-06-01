import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "@/components/site-header";

vi.mock("@/components/auth-controls", () => ({
  AuthControls: () => <div data-testid="auth-controls" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

afterEach(() => {
  cleanup();
});

describe("SiteHeader", () => {
  it("keeps the header focused without primary tool link pileups", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: /Scanlume pagina inicial/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Precos/i })).toHaveAttribute("href", "/precos");
    expect(screen.getByRole("link", { name: /Blog/i })).toHaveAttribute("href", "/blog");
    expect(screen.queryByRole("link", { name: /Imagem para texto/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /PDF para texto/i })).not.toBeInTheDocument();
  });

  it("uses English routes when rendered for /en", () => {
    render(<SiteHeader locale="en" />);

    expect(screen.getByRole("link", { name: /Scanlume home/i })).toHaveAttribute("href", "/en");
    expect(screen.getByRole("link", { name: /Tool/i })).toHaveAttribute("href", "/en/image-to-text");
    expect(screen.getByRole("link", { name: /Pricing/i })).toHaveAttribute("href", "/en/pricing");
    expect(screen.getByRole("link", { name: /API/i })).toHaveAttribute("href", "/en/api");
  });
});
