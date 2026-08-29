import { CURATED_TRIP_SLUGS } from "@/data/curated-trips";

export function getIndexableTripSlugs() {
  const configured = process.env.INDEXABLE_TRIP_SLUGS
    ?.split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);

  return configured?.length ? configured : CURATED_TRIP_SLUGS;
}

export function isIndexableTrip(slug: string) {
  return getIndexableTripSlugs().includes(slug);
}
