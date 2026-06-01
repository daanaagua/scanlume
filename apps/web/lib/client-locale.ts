export type ClientLocale = "pt-BR" | "en";

export function resolveClientLocale(locale?: ClientLocale, pathname?: string | null): ClientLocale {
  if (locale === "en" || pathname?.startsWith("/en")) {
    return "en";
  }

  return "pt-BR";
}
