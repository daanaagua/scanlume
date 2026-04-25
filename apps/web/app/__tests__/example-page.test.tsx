import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ExamplePage from "@/app/example/page";

describe("Example design page", () => {
  it("renders the OCR command desk concept", () => {
    render(<ExamplePage />);

    expect(screen.getByRole("heading", { name: /OCR Command Desk/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Console OCR ao vivo/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Arraste JPG, PNG ou PDF/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Preview estruturado/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Fila de arquivos/i)).toBeInTheDocument();
  });
});
