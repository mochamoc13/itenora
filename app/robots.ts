import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://itenora.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api",
        "/sign-in",
        "/sign-up",
        "/_next",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}