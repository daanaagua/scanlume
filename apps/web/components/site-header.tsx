"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AuthControls } from "@/components/auth-controls";
import { LogoMark } from "@/components/logo-mark";
import { SITE_NAME } from "@/lib/site";

type HeaderLocale = "pt-BR" | "en";

export function SiteHeader({ locale = "pt-BR" }: { locale?: HeaderLocale }) {
  const pathname = usePathname();
  const resolvedLocale = locale === "en" || pathname?.startsWith("/en") ? "en" : "pt-BR";
  const isEnglish = resolvedLocale === "en";

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href={isEnglish ? "/en" : "/"} className="brand-lockup" aria-label={isEnglish ? `${SITE_NAME} home` : `${SITE_NAME} pagina inicial`}>
          <span className="brand-mark">
            <LogoMark />
          </span>
          <span>
            <strong>{SITE_NAME}</strong>
            <small>{isEnglish ? "OCR for images and PDF" : "OCR em pt-BR"}</small>
          </span>
        </Link>

        <nav className="top-nav" aria-label={isEnglish ? "Primary" : "Principal"}>
          <Link href={isEnglish ? "/en/image-to-text" : "/imagem-para-texto"}>{isEnglish ? "Tool" : "Ferramenta"}</Link>
          <Link href={isEnglish ? "/en/pricing" : "/precos"}>{isEnglish ? "Pricing" : "Precos"}</Link>
          <Link href={isEnglish ? "/en/api" : "/blog"}>{isEnglish ? "API" : "Blog"}</Link>
        </nav>

        <div className="header-actions">
          <AuthControls />
        </div>
      </div>
    </header>
  );
}
