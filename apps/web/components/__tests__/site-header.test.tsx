import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteHeader } from "@/components/site-header";

vi.mock("@/components/auth-controls", () => ({
  AuthControls: () => <div data-testid="auth-controls" />,
}));

describe("SiteHeader", () => {
  it("keeps the header focused without primary tool link pileups", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: /Scanlume pagina inicial/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Precos/i })).toHaveAttribute("href", "/precos");
    expect(screen.getByRole("link", { name: /Blog/i })).toHaveAttribute("href", "/blog");
    expect(screen.queryByRole("link", { name: /Imagem para texto/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /PDF para texto/i })).not.toBeInTheDocument();
  });
});
