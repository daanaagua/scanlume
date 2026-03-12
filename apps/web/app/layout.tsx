import type { Metadata } from "next";
import { IBM_Plex_Sans, Syne } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_NAME, SITE_URL } from "@/lib/site";

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
  title: `${SITE_NAME} | OCR simples e formatado em pt-BR`,
  description:
    "Converter imagem em texto online com OCR simples ou formatado. Copie ou baixe em TXT, Markdown e HTML sem instalar aplicativo.",
  openGraph: {
    title: `${SITE_NAME} | OCR simples e formatado em pt-BR`,
    description:
      "Converter imagem em texto online com OCR simples ou formatado. Copie ou baixe em TXT, Markdown e HTML sem instalar aplicativo.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "pt_BR",
    type: "website",
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
        <div className="site-shell">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
