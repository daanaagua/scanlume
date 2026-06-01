import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SupportWidget } from "@/components/support-widget";

vi.mock("@/lib/browser-id", () => ({
  getOrCreateBrowserId: () => "browser-123",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ authenticated: false, user: null }),
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SupportWidget", () => {
  it("uses English support copy on English pages", async () => {
    const user = userEvent.setup();

    render(<SupportWidget locale="en" />);

    const trigger = screen.getByRole("button", { name: "Contact us" });
    expect(trigger).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fale conosco" })).not.toBeInTheDocument();

    await user.click(trigger);

    expect(screen.getAllByText("Contact us").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.getByText(/Tell us your question, bug, or suggestion/i)).toBeInTheDocument();
    expect(screen.getByText(/We reply in English/i)).toBeInTheDocument();
  });
});
