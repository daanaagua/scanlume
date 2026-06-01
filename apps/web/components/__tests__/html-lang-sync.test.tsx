import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const pathnameState = vi.hoisted(() => ({
  pathname: "/en",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.pathname,
}));

import { HtmlLangSync } from "@/components/html-lang-sync";

afterEach(() => {
  cleanup();
  document.documentElement.lang = "";
  pathnameState.pathname = "/en";
});

describe("HtmlLangSync", () => {
  it("sets the document language to English on /en routes", async () => {
    document.documentElement.lang = "pt-BR";

    render(<HtmlLangSync />);

    await waitFor(() => expect(document.documentElement.lang).toBe("en"));
  });

  it("keeps Portuguese as the default document language outside /en", async () => {
    document.documentElement.lang = "en";
    pathnameState.pathname = "/imagem-para-texto";

    render(<HtmlLangSync />);

    await waitFor(() => expect(document.documentElement.lang).toBe("pt-BR"));
  });
});
