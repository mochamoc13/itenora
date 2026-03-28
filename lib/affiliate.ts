export function addDays(dateString: string, days: number) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return undefined;

  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildHotelAffiliateLink(params: {
  destination?: string;
  area?: string;
  checkIn?: string;
  checkOut?: string;
}) {
  const { destination, area, checkIn, checkOut } = params;

  const url = new URL("https://www.agoda.com/search");

  const cityQuery = [area, destination].filter(Boolean).join(", ");

  if (cityQuery) {
    url.searchParams.set("city", cityQuery);
  } else if (destination) {
    url.searchParams.set("city", destination);
  }

  if (checkIn) {
    url.searchParams.set("checkIn", checkIn);
  }

  if (checkOut) {
    url.searchParams.set("checkOut", checkOut);
  }

  return url.toString();
}

// ---------- KLOOK (Activities) ----------

// Known high-converting activities (manual mapping)
const KLOOK_ACTIVITY_MAP: Record<string, string> = {
  "universal studios singapore":
    "https://www.klook.com/en-AU/activity/141-universal-studios-singapore/",
  "gardens by the bay":
    "https://www.klook.com/en-AU/activity/114-gardens-by-the-bay-singapore/",
  "singapore zoo":
    "https://www.klook.com/en-AU/activity/31-singapore-zoo-singapore/",
  "night safari":
    "https://www.klook.com/en-AU/activity/32-night-safari-singapore/",
};

// Build Klook link (auto fallback to search)
export function buildKlookActivityLink(title?: string, destination?: string) {
  const normalizedTitle = (title || "").toLowerCase().trim();

  // Exact match (best conversion)
  if (normalizedTitle && KLOOK_ACTIVITY_MAP[normalizedTitle]) {
    return KLOOK_ACTIVITY_MAP[normalizedTitle];
  }

  // Fallback → search page
  const query = [title, destination].filter(Boolean).join(" ");

  return `https://www.klook.com/en-AU/search/result/?query=${encodeURIComponent(
    query
  )}`;
}

// Decide if we should show "Book on Klook"
export function isBookableActivity(title?: string) {
  const t = (title || "").toLowerCase();

  return [
    "universal",
    "zoo",
    "theme park",
    "ticket",
    "tower",
    "aquarium",
    "museum",
    "cruise",
    "tour",
    "safari",
  ].some((keyword) => t.includes(keyword));
}