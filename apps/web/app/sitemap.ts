import type { MetadataRoute } from "next";

import { BLOG_PATH, BLOG_POSTS } from "@/lib/blog";
import { INDEXABLE_SEO_LINKS, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const buildDate = new Date();
  const trustRoutes = ["/sobre", "/contato", "/privacidade", "/termos"] as const;

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: buildDate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}${BLOG_PATH}`,
      lastModified: buildDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...BLOG_POSTS.map((post) => ({
      url: `${SITE_URL}${BLOG_PATH}/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.88,
    })),
    ...INDEXABLE_SEO_LINKS.map((link) => ({
      url: `${SITE_URL}${link.href}`,
      lastModified: buildDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...trustRoutes.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: buildDate,
      changeFrequency: "monthly" as const,
      priority: 0.45,
    })),
  ];
}
