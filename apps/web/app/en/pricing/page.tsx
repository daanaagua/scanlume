import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { PricingPage } from "@/components/pricing-page";
import { EN_API_PRICING, EN_WEB_PRICING } from "@/lib/pricing";
import { buildEnglishMetadata } from "@/lib/en-metadata";

export const metadata = buildEnglishMetadata({
  title: "Scanlume pricing | Web and API OCR plans",
  description:
    "Compare Scanlume web OCR and API plans, credits, limits, and billing rules for image to text, formatted OCR, and PDF OCR.",
  keywords: ["Scanlume pricing", "OCR pricing", "OCR API pricing", "web OCR plans"],
  pathname: "/en/pricing",
  portuguesePathname: "/precos",
});

export default function EnglishPricingRoute() {
  const canonical = "https://www.scanlume.com/en/pricing";
  const offerEntries = [
    ...EN_WEB_PRICING.monthly.map((plan) => ({
      "@type": "Offer",
      name: `Web ${plan.name}`,
      price: plan.price.replace(/[^0-9.]/g, ""),
      priceCurrency: "USD",
      category: "Web OCR",
      availability: "https://schema.org/InStock",
    })),
    ...EN_API_PRICING.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price.replace(/[^0-9.]/g, ""),
      priceCurrency: "USD",
      category: "API OCR",
      availability: "https://schema.org/InStock",
    })),
  ];

  return (
    <div lang="en">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Scanlume pricing",
          url: canonical,
          inLanguage: "en",
          description: "Compare Scanlume web OCR and API plans, credits, limits, and billing rules.",
          mainEntity: {
            "@type": "OfferCatalog",
            name: "Scanlume plans",
            itemListElement: offerEntries,
          },
        }}
      />
      <PricingPage locale="en" />
      <section className="section-band muted-band">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Before you buy</p>
            <h2>Start in the browser, then move repeatable work to the API.</h2>
            <p>
              Use <Link href="/en/image-to-text">Image to text</Link> for manual OCR and <Link href="/en/api">the API</Link> when you need automation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
