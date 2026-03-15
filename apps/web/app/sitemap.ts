import type { MetadataRoute } from "next";

import { BLOG_PATH, BLOG_POSTS } from "@/lib/blog";
import { SEO_LINKS, SITE_URL, TRUST_LINKS } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    BLOG_PATH,
    ...BLOG_POSTS.map((post) => `${BLOG_PATH}/${post.slug}`),
    ...SEO_LINKS.map((link) => link.href),
    ...TRUST_LINKS.map((link) => link.href),
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
