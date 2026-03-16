import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabaseServerClient();

  const { data: trips } = await supabase
    .from("itineraries")
    .select("slug, created_at")
    .not("slug", "is", null);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://itenora.com";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/trips`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const tripPages: MetadataRoute.Sitemap =
    trips?.map((trip) => ({
      url: `${baseUrl}/trips/share/${trip.slug}`,
      lastModified: trip.created_at ? new Date(trip.created_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    })) || [];

  return [...staticPages, ...tripPages];
}