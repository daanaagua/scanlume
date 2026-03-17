import Link from "next/link";

import { BLOG_POSTS, BLOG_PATH } from "@/lib/blog";
import { NAV_LINKS, SITE_NAME, TOOL_SUPPORT_LINKS, TRUST_LINKS } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-kicker">Scanlume</p>
          <h2>OCR simples e formatado para screenshots, JPG e PNG.</h2>
          <p>
            Feito para converter imagem em texto online sem instalar aplicativo e sem travar o fluxo de copia.
          </p>
          <div className="hero-actions">
            <Link href={BLOG_PATH} className="ghost-button large-button">
              Ler o blog
            </Link>
          </div>
        </div>

        <div>
          <p className="footer-kicker">Paginas principais</p>
          <ul className="footer-links">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="footer-kicker">Confianca</p>
          <ul className="footer-links">
            {TRUST_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="footer-kicker">Outros cenarios</p>
          <ul className="footer-links">
            {TOOL_SUPPORT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="footer-kicker">Do blog</p>
          <ul className="footer-links">
            {BLOG_POSTS.map((post) => (
              <li key={post.slug}>
                <Link href={`${BLOG_PATH}/${post.slug}`}>{post.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>{new Date().getFullYear()} {SITE_NAME}</span>
        <span>pt-BR first. Built for scanlume.com.</span>
      </div>
    </footer>
  );
}
