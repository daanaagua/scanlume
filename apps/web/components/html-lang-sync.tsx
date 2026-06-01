"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function HtmlLangSync() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = pathname?.startsWith("/en") ? "en" : "pt-BR";
  }, [pathname]);

  return null;
}
