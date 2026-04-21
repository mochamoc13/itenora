import { NextResponse } from "next/server";

type LookupResult = {
  label: string;
  city?: string;
  state?: string;
  country?: string;
  type: "city" | "country" | "region" | "place";
  lat?: number;
  lng?: number;
};

const TOP_DESTINATIONS: Array<{
  keywords: string[];
  city: string;
  country: string;
  lat: number;
  lng: number;
  type?: "city" | "country" | "region";
}> = [
  // Regions
  {
    keywords: ["europe", "euro", "european"],
    city: "Europe",
    country: "",
    lat: 54.526,
    lng: 15.2551,
    type: "region",
  },
  {
    keywords: ["asia", "asian"],
    city: "Asia",
    country: "",
    lat: 34.0479,
    lng: 100.6197,
    type: "region",
  },
  {
    keywords: ["southeast asia", "sea"],
    city: "Southeast Asia",
    country: "",
    lat: 10.0,
    lng: 105.0,
    type: "region",
  },
  {
    keywords: ["oceania"],
    city: "Oceania",
    country: "",
    lat: -22.7359,
    lng: 140.0188,
    type: "region",
  },

  // Countries
  {
    keywords: ["japan"],
    city: "Japan",
    country: "Japan",
    lat: 36.2048,
    lng: 138.2529,
    type: "country",
  },
  {
    keywords: ["indonesia", "indo"],
    city: "Indonesia",
    country: "Indonesia",
    lat: -0.7893,
    lng: 113.9213,
    type: "country",
  },
  {
    keywords: ["australia", "aus"],
    city: "Australia",
    country: "Australia",
    lat: -25.2744,
    lng: 133.7751,
    type: "country",
  },
  {
    keywords: ["singapore"],
    city: "Singapore",
    country: "Singapore",
    lat: 1.3521,
    lng: 103.8198,
    type: "country",
  },
  {
    keywords: ["uk", "united kingdom", "england", "britain", "great britain"],
    city: "United Kingdom",
    country: "United Kingdom",
    lat: 55.3781,
    lng: -3.436,
    type: "country",
  },
  {
    keywords: ["usa", "us", "united states", "america"],
    city: "United States",
    country: "United States",
    lat: 37.0902,
    lng: -95.7129,
    type: "country",
  },
  {
    keywords: ["malaysia"],
    city: "Malaysia",
    country: "Malaysia",
    lat: 4.2105,
    lng: 101.9758,
    type: "country",
  },
  {
    keywords: ["thailand"],
    city: "Thailand",
    country: "Thailand",
    lat: 15.87,
    lng: 100.9925,
    type: "country",
  },
  {
    keywords: ["south korea", "korea", "skorea"],
    city: "South Korea",
    country: "South Korea",
    lat: 35.9078,
    lng: 127.7669,
    type: "country",
  },
  {
    keywords: ["china"],
    city: "China",
    country: "China",
    lat: 35.8617,
    lng: 104.1954,
    type: "country",
  },
  {
    keywords: ["france"],
    city: "France",
    country: "France",
    lat: 46.2276,
    lng: 2.2137,
    type: "country",
  },
  {
    keywords: ["italy"],
    city: "Italy",
    country: "Italy",
    lat: 41.8719,
    lng: 12.5674,
    type: "country",
  },
  {
    keywords: ["spain"],
    city: "Spain",
    country: "Spain",
    lat: 40.4637,
    lng: -3.7492,
    type: "country",
  },

  // Cities / destinations
  { keywords: ["tokyo"], city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, type: "city" },
  { keywords: ["osaka"], city: "Osaka", country: "Japan", lat: 34.6937, lng: 135.5023, type: "city" },
  { keywords: ["kyoto"], city: "Kyoto", country: "Japan", lat: 35.0116, lng: 135.7681, type: "city" },
  { keywords: ["bali"], city: "Bali", country: "Indonesia", lat: -8.4095, lng: 115.1889, type: "city" },
  { keywords: ["jakarta"], city: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456, type: "city" },
  { keywords: ["kuala lumpur", "kl"], city: "Kuala Lumpur", country: "Malaysia", lat: 3.139, lng: 101.6869, type: "city" },
  { keywords: ["penang"], city: "Penang", country: "Malaysia", lat: 5.4164, lng: 100.3327, type: "city" },
  { keywords: ["bangkok"], city: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, type: "city" },
  { keywords: ["phuket"], city: "Phuket", country: "Thailand", lat: 7.8804, lng: 98.3923, type: "city" },
  { keywords: ["chiang mai"], city: "Chiang Mai", country: "Thailand", lat: 18.7883, lng: 98.9853, type: "city" },
  { keywords: ["seoul"], city: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978, type: "city" },
  { keywords: ["busan"], city: "Busan", country: "South Korea", lat: 35.1796, lng: 129.0756, type: "city" },
  { keywords: ["shanghai"], city: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737, type: "city" },
  { keywords: ["beijing"], city: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, type: "city" },
  { keywords: ["melbourne"], city: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631, type: "city" },
  { keywords: ["sydney"], city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, type: "city" },
  { keywords: ["brisbane"], city: "Brisbane", country: "Australia", lat: -27.4698, lng: 153.0251, type: "city" },
  { keywords: ["gold coast"], city: "Gold Coast", country: "Australia", lat: -28.0167, lng: 153.4, type: "city" },
  { keywords: ["singapore city"], city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, type: "city" },
  { keywords: ["paris"], city: "Paris", country: "France", lat: 48.8566, lng: 2.3522, type: "city" },
  { keywords: ["london"], city: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278, type: "city" },
  { keywords: ["rome"], city: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, type: "city" },
  { keywords: ["milan"], city: "Milan", country: "Italy", lat: 45.4642, lng: 9.19, type: "city" },
  { keywords: ["venice"], city: "Venice", country: "Italy", lat: 45.4408, lng: 12.3155, type: "city" },
  { keywords: ["barcelona"], city: "Barcelona", country: "Spain", lat: 41.3851, lng: 2.1734, type: "city" },
  { keywords: ["madrid"], city: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038, type: "city" },
  { keywords: ["new york", "nyc"], city: "New York", country: "United States", lat: 40.7128, lng: -74.006, type: "city" },
  { keywords: ["los angeles", "la"], city: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437, type: "city" },
  { keywords: ["las vegas"], city: "Las Vegas", country: "United States", lat: 36.1699, lng: -115.1398, type: "city" },
  { keywords: ["dubai"], city: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, type: "city" },
  { keywords: ["istanbul"], city: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784, type: "city" },
  { keywords: ["zurich"], city: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417, type: "city" },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function classifyType(addresstype?: string, type?: string): LookupResult["type"] {
  const v = normalizeText(`${addresstype || ""} ${type || ""}`);

  if (
    v.includes("city") ||
    v.includes("town") ||
    v.includes("village") ||
    v.includes("municipality")
  ) {
    return "city";
  }

  if (v.includes("country")) {
    return "country";
  }

  if (
    v.includes("state") ||
    v.includes("province") ||
    v.includes("region") ||
    v.includes("county")
  ) {
    return "region";
  }

  return "place";
}

function isAllowedPlace(addresstype?: string, type?: string) {
  const v = normalizeText(`${addresstype || ""} ${type || ""}`);

  const blocked = [
    "road",
    "street",
    "house",
    "residential",
    "hamlet",
    "neighbourhood",
    "suburb",
    "postcode",
    "address",
    "bus_stop",
    "railway",
    "commercial",
    "retail",
    "footway",
    "path",
    "parking",
  ];

  return !blocked.some((x) => v.includes(x));
}

function formatAliasResult(item: (typeof TOP_DESTINATIONS)[number]): LookupResult {
  const type = item.type || (item.country ? "city" : "region");

  if (type === "country") {
    return {
      label: item.country,
      city: item.city,
      country: item.country,
      type,
      lat: item.lat,
      lng: item.lng,
    };
  }

  if (type === "region") {
    return {
      label: item.city,
      city: item.city,
      country: "",
      type,
      lat: item.lat,
      lng: item.lng,
    };
  }

  return {
    label: `${item.city}, ${item.country}`,
    city: item.city,
    country: item.country,
    type,
    lat: item.lat,
    lng: item.lng,
  };
}

function scoreAlias(item: (typeof TOP_DESTINATIONS)[number], query: string) {
  const q = normalizeText(query);
  let score = 0;

  for (const keyword of item.keywords) {
    const k = normalizeText(keyword);

    if (k === q) score = Math.max(score, 300);
    else if (k.startsWith(q)) score = Math.max(score, 240);
    else if (k.includes(q)) score = Math.max(score, 140);
    else if (q.startsWith(k)) score = Math.max(score, 180);
  }

  const city = normalizeText(item.city);
  const country = normalizeText(item.country);

  if (city === q) score += 60;
  else if (city.startsWith(q)) score += 40;

  if (country && country === q) score += 50;
  else if (country && country.startsWith(q)) score += 30;

  if (item.type === "city") score += 20;

  return score;
}

function getAliasMatches(query: string): LookupResult[] {
  return TOP_DESTINATIONS.map((item) => ({
    result: formatAliasResult(item),
    score: scoreAlias(item, query),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.result);
}

function scoreResult(item: any, query: string) {
  const q = normalizeText(query);
  const address = item.address || {};

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    "";

  const country = address.country || "";
  const state = address.state || address.region || "";
  const display = item.display_name || "";

  const haystacks = [city, country, state, display].map(normalizeText);

  let score = 0;

  for (const h of haystacks) {
    if (!h) continue;

    if (h === q) score += 170;
    else if (h.startsWith(q)) score += 110;
    else if (h.includes(q)) score += 35;
  }

  const kind = classifyType(item.addresstype, item.type);
  if (kind === "city") score += 45;
  if (kind === "country") score += 35;
  if (kind === "region") score += 15;

  if (!isAllowedPlace(item.addresstype, item.type)) score -= 200;

  return score;
}

function dedupeResults(results: LookupResult[]) {
  const seen = new Set<string>();

  return results.filter((r) => {
    const key = normalizeText(
      `${r.label}|${r.city || ""}|${r.state || ""}|${r.country || ""}|${r.type}`
    );
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getTrendingSuggestions(): LookupResult[] {
  return [
    formatAliasResult(TOP_DESTINATIONS.find((x) => x.city === "Tokyo")!),
    formatAliasResult(TOP_DESTINATIONS.find((x) => x.city === "Bali")!),
    formatAliasResult(TOP_DESTINATIONS.find((x) => x.city === "Singapore")!),
    formatAliasResult(TOP_DESTINATIONS.find((x) => x.city === "Paris")!),
    formatAliasResult(TOP_DESTINATIONS.find((x) => x.city === "London")!),
    formatAliasResult(TOP_DESTINATIONS.find((x) => x.city === "Gold Coast")!),
  ];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const trending = searchParams.get("trending") === "1";

  if (trending) {
    return NextResponse.json({
      results: getTrendingSuggestions(),
      section: "trending",
    });
  }

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const aliasMatches = getAliasMatches(q);

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "12");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "itenora/1.0",
        "Accept-Language": "en",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({
        results: aliasMatches.slice(0, 8),
        message:
          aliasMatches.length === 0
            ? "No matching destinations found."
            : undefined,
      });
    }

    const raw = await res.json();
    const list = Array.isArray(raw) ? raw : [];

    const mapped = list
      .filter((item) => {
        if (!isAllowedPlace(item.addresstype, item.type)) return false;
        const t = classifyType(item.addresstype, item.type);
        return t === "city" || t === "country" || t === "region";
      })
      .map((item) => {
        const address = item.address || {};
        const city =
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          undefined;

        const country = address.country || undefined;
        const state = address.state || address.region || undefined;
        const type = classifyType(item.addresstype, item.type);

        const cleanCity = city?.trim();
        const cleanCountry = country?.trim();
        const cleanState = state?.trim();

        let label = item.display_name;

        if (type === "country" && cleanCountry) {
          label = cleanCountry;
        } else if (type === "region" && cleanState && cleanCountry) {
          label = `${cleanState}, ${cleanCountry}`;
        } else if (cleanCity && cleanCountry) {
          label = `${cleanCity}, ${cleanCountry}`;
        } else if (cleanCountry) {
          label = cleanCountry;
        } else if (cleanCity) {
          label = cleanCity;
        }

        const preferredCountries = [
          "japan",
          "indonesia",
          "australia",
          "malaysia",
          "singapore",
          "thailand",
          "south korea",
          "france",
          "united kingdom",
          "italy",
          "spain",
          "united states",
        ];

        let boost = 0;

        if (preferredCountries.includes(normalizeText(cleanCountry || ""))) {
          boost += 20;
        }

        if (normalizeText(cleanCity || "") === normalizeText(q)) boost += 60;
        if (normalizeText(cleanCountry || "") === normalizeText(q)) boost += 50;
        if (normalizeText(cleanState || "") === normalizeText(q)) boost += 25;

        const result: LookupResult = {
          label,
          city,
          state,
          country,
          type,
          lat: item.lat ? Number(item.lat) : undefined,
          lng: item.lon ? Number(item.lon) : undefined,
        };

        return {
          result,
          score: scoreResult(item, q) + boost,
        };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.result);

    const deduped = dedupeResults([...aliasMatches, ...mapped]).slice(0, 8);

    if (deduped.length === 0) {
      return NextResponse.json({
        results: [],
        message: "No matching destinations found.",
      });
    }

    return NextResponse.json({ results: deduped });
  } catch {
    return NextResponse.json({
      results: aliasMatches.slice(0, 8),
      message:
        aliasMatches.length === 0 ? "No matching destinations found." : undefined,
    });
  }
}