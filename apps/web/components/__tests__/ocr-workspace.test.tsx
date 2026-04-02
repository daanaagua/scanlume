import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { OcrWorkspace } from "@/components/ocr-workspace";

afterEach(() => {
  cleanup();
});

describe("OcrWorkspace", () => {
  it("shows images-only guidance in OCR simples mode", () => {
    render(<OcrWorkspace defaultMode="simple" priorityLayout />);

    expect(screen.getByText(/ocr simples aceita apenas imagens/i)).not.toBeNull();
  });

  it("accepts PDFs only in Texto formatado mode", async () => {
    const user = userEvent.setup();
    render(<OcrWorkspace defaultMode="simple" priorityLayout />);

    const input = document.querySelector("#scanlume-upload") as HTMLInputElement;
    expect(input).toHaveAttribute("accept", "image/*");

    await user.click(screen.getAllByRole("button", { name: /texto formatado/i })[0]);
    expect(input).toHaveAttribute("accept", "image/*,application/pdf");
  });
});
