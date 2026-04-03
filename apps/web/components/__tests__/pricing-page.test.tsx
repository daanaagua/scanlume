import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PricingPage } from "@/components/pricing-page";

afterEach(() => {
  cleanup();
});

describe("PricingPage", () => {
  it("shows Starter, Pro, and Business web plans with approved monthly and annual prices", () => {
    render(<PricingPage />);

    expect(screen.getByText("$5 / mes")).toBeInTheDocument();
    expect(screen.getByText("$9 / mes")).toBeInTheDocument();
    expect(screen.getByText("$24 / mes")).toBeInTheDocument();
    expect(screen.getByText("$48 / ano")).toBeInTheDocument();
    expect(screen.getByText("$82 / ano")).toBeInTheDocument();
    expect(screen.getByText("$228 / ano")).toBeInTheDocument();
  });

  it("shows code tabs, billing disclosures, and API commercial fields", () => {
    render(<PricingPage />);

    expect(screen.getByRole("tab", { name: "cURL" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "JavaScript" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Python" })).toBeInTheDocument();
    expect(screen.getByText(/nao rolam para o proximo periodo/i)).toBeInTheDocument();
    expect(screen.getByText(/API credits sao separados dos web credits/i)).toBeInTheDocument();
    expect(screen.getByText(/Simple OCR = 1 credit/i)).toBeInTheDocument();
    expect(screen.getByText(/Formatted OCR = 2 credits/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF OCR = 2 credits/i)).toBeInTheDocument();
    expect(screen.getByText(/1 formatted OCR image costs only 2 credits on Scanlume/i)).toBeInTheDocument();
    expect(screen.getByText(/60 RPM/i)).toBeInTheDocument();
    expect(screen.getAllByText(/file upload, image URL, base64/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Enterprise/i)).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });
});
