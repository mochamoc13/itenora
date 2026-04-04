// ---------- DATE HELPERS ----------

export function addDays(dateString: string, days: number) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return undefined;

  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// ---------- HOTEL LINKS ----------

export function buildHotelAffiliateLink(params: {
  destination?: string;
  area?: string;
  checkIn?: string;
  checkOut?: string;
}) {
  const { destination, area, checkIn, checkOut } = params;

  // Combine area + destination (better conversion)
  const query = [area, destination].filter(Boolean).join(", ").trim();
  const finalQuery = query || destination || "";

  const url = new URL("https://www.agoda.com/search");

  // ✅ FIXED: ONLY use textToSearch (NO city param)
  if (finalQuery) {
    url.searchParams.set("textToSearch", finalQuery);
  }

  if (checkIn) {
    url.searchParams.set("checkIn", checkIn);
  }

  if (checkOut) {
    url.searchParams.set("checkOut", checkOut);
  }

  // Required params so Agoda actually searches
  url.searchParams.set("rooms", "1");
  url.searchParams.set("adults", "2");

  return url.toString();
}

// ---------- BOOKING.COM ----------

export function buildBookingAffiliateLink(params: {
  destination?: string;
  area?: string;
  checkIn?: string;
  checkOut?: string;
}) {
  const { destination, area, checkIn, checkOut } = params;

  const base = "https://www.booking.com/searchresults.html";
  const query = [area, destination].filter(Boolean).join(", ");

  const url = new URL(base);

  if (query) {
    url.searchParams.set("ss", query);
  }

  if (checkIn) {
    url.searchParams.set("checkin", checkIn);
  }

  if (checkOut) {
    url.searchParams.set("checkout", checkOut);
  }

  return url.toString();
}

// ---------- KLOOK (Activities) ----------

type KlookMatch = {
  directUrl: string;
  affiliateUrl?: string;
};

function clean(value?: string) {
  return (value || "").toLowerCase().trim();
}

function pickKlookUrl(match: KlookMatch) {
  return match.affiliateUrl?.trim() || match.directUrl;
}

function getKlookMappedActivity(
  title?: string,
  destination?: string
): KlookMatch | null {
  const t = clean(title);
  const d = clean(destination);

  // ---------- SINGAPORE ----------
  if (d.includes("singapore")) {
    if (t.includes("universal")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/141-universal-studios-singapore/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F117-universal-studios-singapore%2F",
      };
    }

    if (t.includes("gardens by the bay")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/114-gardens-by-the-bay-singapore/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F127-gardens-by-the-bay-singapore%2F",
      };
    }

    if (t.includes("night safari")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/32-night-safari-singapore/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F3928-singapore-night-safari-singapore%2F",
      };
    }

    if (t.includes("zoo")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/31-singapore-zoo-singapore/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F141-singapore-zoo-singapore%2F",
      };
    }

    if (
      t.includes("aquarium") ||
      t.includes("s.e.a.") ||
      t.includes("sea aquarium")
    ) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/129-sea-aquarium-singapore/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F119-singapore-oceanarium%2F",
      };
    }
  }

  // ---------- JAPAN ----------
  if (d.includes("tokyo")) {
    if (t.includes("teamlab")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/18692-teamlab-planets-tokyo/",
      };
    }
  }

  // ---------- DEFAULT SEARCH ----------
  return null;
}

export function buildKlookActivityLink(
  title?: string,
  destination?: string
) {
  const mapped = getKlookMappedActivity(title, destination);

  if (mapped) {
    return pickKlookUrl(mapped);
  }

  const query = [title, destination].filter(Boolean).join(" ").trim();

  return `https://www.klook.com/en-AU/search/result/?query=${encodeURIComponent(
    query
  )}`;
}

// ---------- HELPERS ----------

export function isBookableActivity(title?: string) {
  const t = clean(title);

  return [
    "universal",
    "disney",
    "zoo",
    "aquarium",
    "museum",
    "tower",
    "theme park",
    "ticket",
    "safari",
    "cruise",
    "tour",
    "observation",
    "cable car",
    "teamlab",
    "ghibli",
  ].some((keyword) => t.includes(keyword));
}

export function isTopAttraction(title?: string) {
  const t = (title || "").toLowerCase();

  return [
    "universal",
    "disney",
    "zoo",
    "aquarium",
    "theme park",
    "teamlab",
  ].some((k) => t.includes(k));
}