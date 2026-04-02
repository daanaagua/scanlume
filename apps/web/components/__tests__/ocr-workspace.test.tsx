import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OcrWorkspace } from "@/components/ocr-workspace";

describe("OcrWorkspace", () => {
  it("shows a PDF-specific queue summary after selecting a PDF", () => {
    render(<OcrWorkspace defaultMode="simple" priorityLayout />);

    expect(screen.queryByText(/paginas/i)).not.toBeNull();
  });
});
