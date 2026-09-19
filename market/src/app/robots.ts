import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3100";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/partner", "/account", "/api", "/checkout"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
