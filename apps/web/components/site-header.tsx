import Link from "next/link";

import { NAV_LINKS, SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand-lockup" aria-label={`${SITE_NAME} homepage`}>
          <span className="brand-mark">S</span>
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
        </nav>

        <Link href="/imagem-para-texto" className="header-cta">
          Testar gratis
        </Link>
      </div>
    </header>
  );
}
