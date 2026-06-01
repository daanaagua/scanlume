import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteFooter } from "@/components/site-footer";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

afterEach(() => {
  cleanup();
});

describe("SiteFooter", () => {
  it("exposes a direct API documentation link for developer discovery", () => {
    render(<SiteFooter />);

    const footer = screen.getByRole("contentinfo");
    const apiLink = within(footer).getByRole("link", { name: "API" });

    expect(apiLink).toHaveAttribute("href", "/api");
  });

  it("keeps English footer links inside English routes", () => {
    render(<SiteFooter locale="en" />);

    const footer = screen.getByRole("contentinfo");

    expect(within(footer).getByRole("link", { name: "About" })).toHaveAttribute("href", "/en/about");
    expect(within(footer).getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/en/contact");
    expect(within(footer).getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/en/privacy");
    expect(within(footer).getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/en/terms");
    expect(within(footer).getByRole("link", { name: /English updates/i })).toHaveAttribute("href", "/en/blog");
    expect(within(footer).queryByText(/OCR simples|texto formatado|portugues/i)).not.toBeInTheDocument();
  });
});
