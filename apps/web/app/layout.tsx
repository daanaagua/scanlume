import type { Metadata } from "next";
import { IBM_Plex_Sans, Syne } from "next/font/google";
import Script from "next/script";

import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SupportWidget } from "@/components/support-widget";
import { DEFAULT_KEYWORDS, SITE_NAME, SITE_URL, SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_PATH } from "@/lib/site";

import "./globals.css";

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} | Imagem para texto com IA em pt-BR`,
  description:
    "Converta imagem para texto com IA em pt-BR. OCR online para JPG, PNG e screenshots com saida simples ou formatada em TXT, Markdown e HTML.",
  keywords: DEFAULT_KEYWORDS,
  applicationName: SITE_NAME,
  alternates: {
    languages: {
      "pt-BR": `${SITE_URL}/`,
      "x-default": `${SITE_URL}/`,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: `${SITE_NAME} | Imagem para texto com IA em pt-BR`,
    description:
      "Converta imagem para texto com IA em pt-BR. OCR online para JPG, PNG e screenshots com saida simples ou formatada em TXT, Markdown e HTML.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: SOCIAL_IMAGE_PATH,
        alt: SOCIAL_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Imagem para texto com IA em pt-BR`,
    description:
      "Converta imagem para texto com IA em pt-BR. OCR online para JPG, PNG e screenshots com saida simples ou formatada em TXT, Markdown e HTML.",
    images: [SOCIAL_IMAGE_PATH],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/icon.png`,
            sameAs: ["https://toolsaiapp.com/", "https://newtool.site/item/scanlume"],
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: SITE_URL,
            inLanguage: "pt-BR",
          }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ST57ZKSQZJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ST57ZKSQZJ');
          `}
        </Script>
        <div className="site-shell">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <SupportWidget />
        </div>
      </body>
    </html>
  );
}
