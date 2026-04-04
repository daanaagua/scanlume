import Link from "next/link";

import { AuthControls } from "@/components/auth-controls";
import { LogoMark } from "@/components/logo-mark";
import { NAV_LINKS, SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand-lockup" aria-label={`${SITE_NAME} pagina inicial`}>
          <span className="brand-mark">
            <LogoMark />
          </span>
          <span>
            <strong>{SITE_NAME}</strong>
            <small>OCR em pt-BR</small>
          </span>
        </Link>

        <nav className="top-nav" aria-label="Principal">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          <Link href="/blog">Blog</Link>
        </nav>

        <div className="header-actions">
          <Link href="/precos" className="header-price-tag" aria-label="Ver precos do Scanlume, desde $5 por mes">
            <span className="header-price-tag-kicker">Planos</span>
            <strong>Desde $5</strong>
            <small>Ver precos</small>
          </Link>
          <AuthControls />
        </div>
      </div>
    </header>
  );
}
