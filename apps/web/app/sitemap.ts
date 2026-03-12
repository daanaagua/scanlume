import type { MetadataRoute } from "next";

import { NAV_LINKS, SITE_URL, TRUST_LINKS } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", ...NAV_LINKS.map((link) => link.href), ...TRUST_LINKS.map((link) => link.href)];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
