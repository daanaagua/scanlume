import type { MetadataRoute } from "next";

import { BLOG_PATH, BLOG_POSTS } from "@/lib/blog";
import { INDEXABLE_SEO_LINKS, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const contentReviewedAt = new Date("2026-04-24");
  const trustRoutes = ["/sobre", "/metodo-e-evidencia", "/contato", "/privacidade", "/termos"] as const;
  const commercialRoutes = ["/precos", "/api"] as const;
  const englishRoutes = ["/en", "/en/image-to-text", "/en/pricing", "/en/api"] as const;

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: contentReviewedAt,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}${BLOG_PATH}`,
      lastModified: contentReviewedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...BLOG_POSTS.map((post) => ({
      url: `${SITE_URL}${BLOG_PATH}/${post.slug}`,
      lastModified: new Date(post.lastReviewedAt),
      changeFrequency: "monthly" as const,
      priority: 0.88,
    })),
    ...INDEXABLE_SEO_LINKS.map((link) => ({
      url: `${SITE_URL}${link.href}`,
      lastModified: contentReviewedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...trustRoutes.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: contentReviewedAt,
      changeFrequency: "monthly" as const,
      priority: 0.45,
    })),
    ...commercialRoutes.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: contentReviewedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...englishRoutes.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: contentReviewedAt,
      changeFrequency: "weekly" as const,
      priority: route === "/en" ? 0.72 : 0.64,
    })),
  ];
}
