import { AccountPanel } from "@/components/account-panel";
import { buildEnglishMetadata } from "@/lib/en-metadata";

export const metadata = {
  ...buildEnglishMetadata({
    title: "Scanlume account",
    description: "Manage your Scanlume account, OCR credits, API keys, and checkout handoff.",
    keywords: ["Scanlume account", "OCR credits", "OCR API keys"],
    pathname: "/en/account",
    portuguesePathname: "/conta",
  }),
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function EnglishAccountPage() {
  return (
    <div lang="en">
      <section className="section-band legal-band">
        <div className="container">
          <AccountPanel locale="en" />
        </div>
      </section>
    </div>
  );
}
