const DEFAULT_INDEXABLE_TRIPS = [
  "singapore-3-day-family-budget-itinerary",
  "tokyo-7-day-family-itinerary",
  "sydney-3-day-family-budget-itinerary",
];

export function getIndexableTripSlugs() {
  const configured = process.env.INDEXABLE_TRIP_SLUGS
    ?.split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);

  return configured?.length ? configured : DEFAULT_INDEXABLE_TRIPS;
}

export function isIndexableTrip(slug: string) {
  return getIndexableTripSlugs().includes(slug);
}
