import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthDialog } from "@/components/auth-dialog";
import { PasswordResetRequest } from "@/components/password-reset-request";
import { SupportDesk } from "@/components/support-desk";

vi.mock("@/lib/browser-id", () => ({
  getOrCreateBrowserId: () => "browser-123",
}));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: async () => ({ authenticated: false, user: null }),
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("email placeholders", () => {
  it("uses a neutral user email example across public forms", () => {
    render(<AuthDialog open onClose={() => undefined} />);
    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("voce@empresa.com")).toBeNull();

    cleanup();
    render(<PasswordResetRequest />);
    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("voce@empresa.com")).toBeNull();

    cleanup();
    render(<SupportDesk />);
    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("voce@empresa.com")).toBeNull();
  });
});
