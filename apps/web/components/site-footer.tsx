"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BLOG_POSTS, BLOG_PATH } from "@/lib/blog";
import { FOOTER_SUPPORT_LINKS, NAV_LINKS, SITE_NAME, TRUST_LINKS } from "@/lib/site";

type FooterLocale = "pt-BR" | "en";

export function SiteFooter({ locale = "pt-BR" }: { locale?: FooterLocale }) {
  const pathname = usePathname();
  const resolvedLocale = locale === "en" || pathname?.startsWith("/en") ? "en" : "pt-BR";
  const isEnglish = resolvedLocale === "en";
  const mainLinks = isEnglish
    ? [
        { href: "/en", label: "Home" },
        { href: "/en/image-to-text", label: "Image to text" },
        { href: "/en/pricing", label: "Pricing" },
        { href: "/en/api", label: "API" },
      ]
    : NAV_LINKS;
  const trustLinks = isEnglish
    ? [
        { href: "/en/about", label: "About" },
        { href: "/en/contact", label: "Contact" },
        { href: "/en/privacy", label: "Privacy" },
        { href: "/en/terms", label: "Terms" },
      ]
    : TRUST_LINKS;
  const englishResourceLinks = [
    { href: "/en/blog", label: "English updates" },
    { href: "/en/image-to-text", label: "OCR workflow" },
    { href: "/en/pricing", label: "Plans and credits" },
  ];

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-kicker">Scanlume</p>
          <h2>{isEnglish ? "Simple and formatted OCR for screenshots, JPG, PNG, and PDF." : "OCR simples e formatado para screenshots, JPG e PNG."}</h2>
          <p>
            {isEnglish
              ? "Convert images to editable text online without installing an app."
              : "Feito para converter imagem em texto online sem instalar aplicativo e sem travar o fluxo de copia."}
          </p>
          <div className="hero-actions">
            <Link href={isEnglish ? "/en/image-to-text" : BLOG_PATH} className="ghost-button large-button">
              {isEnglish ? "Open the tool" : "Ler o blog"}
            </Link>
          </div>
        </div>

        <div>
          <p className="footer-kicker">{isEnglish ? "Main pages" : "Paginas principais"}</p>
          <ul className="footer-links">
            {mainLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
            {!isEnglish && (
              <li>
                <Link href="/api">API</Link>
              </li>
            )}
          </ul>
        </div>

        <div>
          <p className="footer-kicker">{isEnglish ? "Trust" : "Confianca"}</p>
          <ul className="footer-links">
            {trustLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="footer-kicker">{isEnglish ? "Other OCR routes" : "Outros cenarios"}</p>
          <ul className="footer-links">
            {(isEnglish ? [{ href: "/en/image-to-text", label: "Image to text" }, { href: "/en/api", label: "OCR API" }] : FOOTER_SUPPORT_LINKS).map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="footer-kicker">{isEnglish ? "Resources" : "Do blog"}</p>
          <ul className="footer-links">
            {(isEnglish ? englishResourceLinks : BLOG_POSTS.map((post) => ({ href: `${BLOG_PATH}/${post.slug}`, label: post.title }))).map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>{new Date().getFullYear()} {SITE_NAME}</span>
        <span>{isEnglish ? "English entry points. Core product remains pt-BR first." : "pt-BR first. Built for scanlume.com."}</span>
      </div>
    </footer>
  );
}
