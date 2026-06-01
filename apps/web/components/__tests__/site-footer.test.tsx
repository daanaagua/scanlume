import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "@/components/site-footer";

describe("SiteFooter", () => {
  it("exposes a direct API documentation link for developer discovery", () => {
    render(<SiteFooter />);

    const footer = screen.getByRole("contentinfo");
    const apiLink = within(footer).getByRole("link", { name: "API" });

    expect(apiLink).toHaveAttribute("href", "/api");
  });
});
