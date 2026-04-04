import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || "https://itenora.com").replace(/\/$/, "");

  const supabase = createSupabaseServerClient();

  const { data: trips, error } = await supabase
    .from("itineraries")
    .select("slug, created_at")
    .not("slug", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Sitemap query error:", error);
  }

  const safeTrips = (trips ?? []).filter(
    (trip) => typeof trip.slug === "string" && trip.slug.trim().length > 0
  );

  const latestTripDate =
    safeTrips.length > 0 && safeTrips[0].created_at
      ? new Date(safeTrips[0].created_at)
      : new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: latestTripDate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/trips`,
      lastModified: latestTripDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const tripPages: MetadataRoute.Sitemap = safeTrips.map((trip) => ({
    url: `${baseUrl}/trips/share/${trip.slug}`,
    lastModified: trip.created_at ? new Date(trip.created_at) : latestTripDate,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...tripPages];
}