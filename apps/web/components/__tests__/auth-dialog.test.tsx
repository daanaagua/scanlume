import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthDialog } from "@/components/auth-dialog";

const loginWithPasswordMock = vi.fn();
const registerWithPasswordMock = vi.fn();
const startGoogleLoginMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  loginWithPassword: (...args: unknown[]) => loginWithPasswordMock(...args),
  registerWithPassword: (...args: unknown[]) => registerWithPasswordMock(...args),
  startGoogleLogin: (...args: unknown[]) => startGoogleLoginMock(...args),
}));

describe("AuthDialog", () => {
  afterEach(() => {
    cleanup();
    loginWithPasswordMock.mockReset();
    registerWithPasswordMock.mockReset();
    startGoogleLoginMock.mockReset();
  });

  it("blocks Yahoo-family emails during registration with a direct hint", async () => {
    const user = userEvent.setup();

    render(<AuthDialog open onClose={() => {}} defaultMode="register" reloadOnSuccess={false} />);

    await user.type(screen.getByLabelText("Nome"), "Jam Yanh");
    await user.type(screen.getByLabelText("Email"), "pony@yahoo.com");
    await user.type(screen.getByLabelText("Senha"), "supersecret123");
    await user.click(screen.getByRole("button", { name: "Criar conta com email" }));

    expect(registerWithPasswordMock).not.toHaveBeenCalled();
    expect(
      await screen.findByText("No momento nao aceitamos cadastro com emails Yahoo. Use outro email ou continue com Google."),
    ).toBeInTheDocument();
  });

  it("does not show the Yahoo hint on the login flow", async () => {
    const user = userEvent.setup();
    loginWithPasswordMock.mockResolvedValue({
      ok: true,
      viewer: {
        authenticated: true,
        user: {
          id: "u1",
          email: "pony@yahoo.com",
          name: "Jam Yanh",
          avatarUrl: null,
          emailVerified: true,
          emailVerifiedAt: null,
          hasPassword: true,
          authProviders: ["password"],
        },
      },
    });

    render(<AuthDialog open onClose={() => {}} defaultMode="login" reloadOnSuccess={false} />);

    await user.type(screen.getByLabelText("Email"), "pony@yahoo.com");
    await user.type(screen.getByLabelText("Senha"), "supersecret123");
    await user.click(screen.getByRole("button", { name: "Entrar com email" }));

    expect(loginWithPasswordMock).toHaveBeenCalledWith({
      email: "pony@yahoo.com",
      password: "supersecret123",
    });
    expect(
      screen.queryByText("No momento nao aceitamos cadastro com emails Yahoo. Use outro email ou continue com Google."),
    ).not.toBeInTheDocument();
  });
});
