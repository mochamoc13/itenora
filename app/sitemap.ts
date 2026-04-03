import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://itenora.com";

  // ✅ USE SERVER CLIENT (THIS IS THE FIX)
  const supabase = createSupabaseServerClient();

  const { data: trips, error } = await supabase
    .from("itineraries")
    .select("slug, created_at")
    .not("slug", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Sitemap query error:", error);
  }

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

  const tripPages: MetadataRoute.Sitemap = (trips ?? [])
    .filter((trip) => trip.slug)
    .map((trip) => ({
      url: `${baseUrl}/trips/share/${trip.slug}`,
      lastModified: trip.created_at
        ? new Date(trip.created_at)
        : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticPages, ...tripPages];
}