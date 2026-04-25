import Link from "next/link";

import { AuthControls } from "@/components/auth-controls";
import { LogoMark } from "@/components/logo-mark";
import { SITE_NAME } from "@/lib/site";

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
          <Link href="/imagem-para-texto">Ferramenta</Link>
          <Link href="/precos">Precos</Link>
          <Link href="/blog">Blog</Link>
        </nav>

        <div className="header-actions">
          <AuthControls />
        </div>
      </div>
    </header>
  );
}
