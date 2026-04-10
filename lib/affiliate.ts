import { AREA_TO_CITY } from "@/lib/hotel-maps/areaToCity";
import { COUNTRY_FALLBACK } from "@/lib/hotel-maps/countryFallbacks";
import { CITY_PATHS } from "@/lib/hotel-maps/tripCityPaths";

// ---------- DATE HELPERS ----------

export function addDays(dateString: string, days: number) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return undefined;

  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// ---------- SHARED HELPERS ----------

function clean(value?: string) {
  return (value || "").toLowerCase().trim();
}

function cleanText(value?: string) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function getTripCity(destination?: string) {
  return cleanText((destination || "").split(",")[0]);
}

// ---------- HOTEL LINKS (TRIP.COM PRIMARY) ----------

const TRIP_ALLIANCE_ID = "8062244";
const TRIP_SID = "305024455";
const KLOOK_AID = "117141";

const IGNORED_AREAS = new Set([
  "cbd",
  "central",
  "downtown",
  "city centre",
  "city center",
]);

const CITY_ALIASES: Record<string, string> = {
  roma: "rome",
  milano: "milan",
  firenze: "florence",
  venezia: "venice",
  napoli: "naples",
  kyouto: "kyoto",
  "kuala-lumpur": "kuala lumpur",
  "ho chi minh": "ho chi minh city",
  saigon: "ho chi minh city",
  hcmc: "ho chi minh city",
  "new york city": "new york",
  nyc: "new york",
  la: "los angeles",
  hongkong: "hong kong",

  // Japan
  "osaka japan": "osaka",
  "osaka prefecture": "osaka",
  "shin osaka": "osaka",
  "shin-osaka": "osaka",
  kansai: "osaka",

  // Vietnam
  danang: "da nang",
  hoian: "hoi an",
  nhatrang: "nha trang",
  phuquoc: "phu quoc",

  // Thailand
  bangkokthailand: "bangkok",
  phuketthailand: "phuket",
};

function normalizeCityLike(value?: string) {
  const cleaned = cleanText(value).toLowerCase();
  if (!cleaned) return "";
  return CITY_ALIASES[cleaned] || cleaned;
}

function resolveHotelSearchLocation(destination?: string, area?: string) {
  const tripCity = getTripCity(destination);
  const cleanDestination = tripCity || cleanText(destination);
  const cleanArea = cleanText(area);

  const areaKey = normalizeCityLike(cleanArea);
  const destinationKey = normalizeCityLike(cleanDestination);

  if (AREA_TO_CITY[areaKey]) {
    return AREA_TO_CITY[areaKey];
  }

  if (COUNTRY_FALLBACK[destinationKey]) {
    return COUNTRY_FALLBACK[destinationKey];
  }

  if (CITY_PATHS[destinationKey]) {
    return destinationKey;
  }

  for (const city of Object.keys(CITY_PATHS)) {
    if (destinationKey.includes(city)) {
      return city;
    }
  }

  for (const country of Object.keys(COUNTRY_FALLBACK)) {
    if (destinationKey.includes(country)) {
      return COUNTRY_FALLBACK[country];
    }
  }

  if (cleanArea && !IGNORED_AREAS.has(clean(cleanArea))) {
    if (CITY_PATHS[areaKey]) {
      return areaKey;
    }

    for (const city of Object.keys(CITY_PATHS)) {
      if (areaKey.includes(city)) {
        return city;
      }
    }
  }

  return destinationKey;
}

function buildTripCityHotelBase(location?: string) {
  const key = normalizeCityLike(location);
  return CITY_PATHS[key] || "";
}

export function buildHotelAffiliateLink(params: {
  destination?: string;
  area?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
}) {
  const { destination, area, checkIn, checkOut, adults } = params;

  const resolvedLocation = resolveHotelSearchLocation(destination, area);
  const baseUrl = buildTripCityHotelBase(resolvedLocation);

  if (!baseUrl) {
    return buildBookingAffiliateLink({
      destination: resolvedLocation || destination,
      checkIn,
      checkOut,
      adults,
    });
  }

  const searchParams = new URLSearchParams();

  if (checkIn) searchParams.set("checkin", checkIn);
  if (checkOut) searchParams.set("checkout", checkOut);

  searchParams.set("adult", String(adults || 2));
  searchParams.set("rooms", "1");
  searchParams.set("Allianceid", TRIP_ALLIANCE_ID);
  searchParams.set("SID", TRIP_SID);

  return `${baseUrl}?${searchParams.toString()}`;
}

// ---------- BOOKING.COM FALLBACK ----------

export function buildBookingAffiliateLink(params: {
  destination?: string;
  area?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
}) {
  const { destination, area, checkIn, checkOut, adults } = params;

  const searchParams = new URLSearchParams();
  const query = [cleanText(area), cleanText(destination)]
    .filter(Boolean)
    .join(", ");

  if (query) {
    searchParams.set("ss", query);
  }

  if (checkIn) {
    searchParams.set("checkin", checkIn);
  }

  if (checkOut) {
    searchParams.set("checkout", checkOut);
  }

  if (adults) {
    searchParams.set("group_adults", String(adults));
  }

  searchParams.set("no_rooms", "1");

  return `https://www.booking.com/searchresults.html?${searchParams.toString()}`;
}

// ---------- KLOOK (Activities) ----------

type KlookMatch = {
  directUrl: string;
  affiliateUrl?: string;
};

function buildKlookAffiliateRedirect(directUrl: string, affAdid?: string) {
  const params = new URLSearchParams();
  params.set("aid", KLOOK_AID);

  if (affAdid) {
    params.set("aff_adid", affAdid);
  }

  params.set("k_site", directUrl);

  return `https://affiliate.klook.com/redirect?${params.toString()}`;
}

function pickKlookUrl(match: KlookMatch) {
  if (match.affiliateUrl?.trim()) {
    return match.affiliateUrl.trim();
  }

  return buildKlookAffiliateRedirect(match.directUrl);
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
          "https://www.klook.com/en-AU/activity/117-universal-studios-singapore/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1253287&k_site=https%3A%2F%2Fwww.klook.com%2Fen-GB%2Factivity%2F117-universal-studios-singapore%2F",
      };
    }

    if (t.includes("gardens by the bay")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/127-gardens-by-the-bay-singapore/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1253289&k_site=https%3A%2F%2Fwww.klook.com%2Fen-AU%2Factivity%2F127-gardens-by-the-bay-singapore%2F",
      };
    }

    if (t.includes("night safari")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/32-night-safari-singapore/",
      };
    }

    if (t.includes("zoo")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/31-singapore-zoo-singapore/",
      };
    }
  }

  // ---------- HONG KONG ----------
  if (d.includes("hong kong")) {
    if (t.includes("ocean park")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/23-ocean-park-hong-kong-hong-kong/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1253287&k_site=https%3A%2F%2Fwww.klook.com%2Fen-GB%2Factivity%2F23-ocean-park-hong-kong-hong-kong%2F",
      };
    }
  }

  // ---------- JAPAN ----------
  if (d.includes("osaka") || d.includes("japan")) {
    if (t.includes("universal")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/search/result/?query=universal%20studios%20japan",
      };
    }
  }

  // ---------- AUSTRALIA ----------
  if (d.includes("melbourne")) {
    if (
      t.includes("great ocean road") ||
      t.includes("12 apostles") ||
      t.includes("twelve apostles")
    ) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/156183-great-ocean-road-12-apostles-full-day-tour-from-melbourne/",
      };
    }
  }

  return null;
}

export function buildKlookActivityLink(title?: string, destination?: string) {
  const mapped = getKlookMappedActivity(title, destination);

  if (mapped) {
    return pickKlookUrl(mapped);
  }

  const query = [cleanText(title), cleanText(destination)]
    .filter(Boolean)
    .join(" ")
    .trim();

  const searchUrl = `https://www.klook.com/en-AU/search/result/?query=${encodeURIComponent(
    query
  )}`;

  return buildKlookAffiliateRedirect(searchUrl);
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
    "lotte world",
    "gardens by the bay",
    "dreamworld",
    "great ocean road",
    "12 apostles",
    "twelve apostles",
    "blueline",
    "nusa penida",
    "ocean park",
  ].some((keyword) => t.includes(keyword));
}

export function isTopAttraction(title?: string) {
  const t = clean(title);

  return [
    "universal",
    "disney",
    "zoo",
    "aquarium",
    "theme park",
    "gardens by the bay",
    "great ocean road",
    "12 apostles",
    "twelve apostles",
    "nusa penida",
    "lotte world",
    "teamlab",
    "ocean park",
  ].some((keyword) => t.includes(keyword));
}