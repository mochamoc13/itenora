import type { MetadataRoute } from "next";
import { getIndexableTripSlugs } from "@/lib/indexable-trips";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://itenora.com").replace(
    /\/$/,
    ""
  );
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const curatedTrips: MetadataRoute.Sitemap = getIndexableTripSlugs().map(
    (slug) => ({
      url: `${baseUrl}/trips/share/${slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    })
  );

  return [...staticPages, ...curatedTrips];
}
