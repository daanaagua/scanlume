import type { Metadata } from "next";

import { SITE_NAME, SITE_URL, SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_PATH } from "@/lib/site";

export function buildEnglishMetadata({
  title,
  description,
  pathname,
  portuguesePathname,
  keywords = [],
}: {
  title: string;
  description: string;
  pathname: string;
  portuguesePathname: string;
  keywords?: readonly string[];
}): Metadata {
  const canonical = `${SITE_URL}${pathname}`;
  const portugueseCanonical = portuguesePathname === "/" ? `${SITE_URL}/` : `${SITE_URL}${portuguesePathname}`;

  return {
    title,
    description,
    keywords: [...keywords],
    applicationName: SITE_NAME,
    category: "OCR",
    alternates: {
      canonical,
      languages: {
        en: canonical,
        "pt-BR": portugueseCanonical,
        "x-default": portugueseCanonical,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: SOCIAL_IMAGE_PATH,
          alt: SOCIAL_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SOCIAL_IMAGE_PATH],
    },
  };
}
