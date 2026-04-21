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

const DESTINATION_ALIASES: Array<{
  keywords: string[];
  result: LookupResult;
}> = [
  {
    keywords: ["europe", "euro", "european"],
    result: {
      label: "Europe",
      city: "Europe",
      country: "",
      type: "region",
      lat: 54.526,
      lng: 15.2551,
    },
  },
  {
    keywords: ["asia", "asian"],
    result: {
      label: "Asia",
      city: "Asia",
      country: "",
      type: "region",
      lat: 34.0479,
      lng: 100.6197,
    },
  },
  {
    keywords: ["oceania"],
    result: {
      label: "Oceania",
      city: "Oceania",
      country: "",
      type: "region",
      lat: -22.7359,
      lng: 140.0188,
    },
  },
  {
    keywords: ["bali"],
    result: {
      label: "Bali, Indonesia",
      city: "Bali",
      country: "Indonesia",
      type: "city",
      lat: -8.4095,
      lng: 115.1889,
    },
  },
  {
    keywords: ["indonesia", "indo"],
    result: {
      label: "Indonesia",
      city: "Indonesia",
      country: "Indonesia",
      type: "country",
      lat: -0.7893,
      lng: 113.9213,
    },
  },
  {
    keywords: ["japan"],
    result: {
      label: "Japan",
      city: "Japan",
      country: "Japan",
      type: "country",
      lat: 36.2048,
      lng: 138.2529,
    },
  },
  {
    keywords: ["australia", "aus"],
    result: {
      label: "Australia",
      city: "Australia",
      country: "Australia",
      type: "country",
      lat: -25.2744,
      lng: 133.7751,
    },
  },
  {
    keywords: ["uk", "united kingdom", "england", "britain", "great britain"],
    result: {
      label: "United Kingdom",
      city: "United Kingdom",
      country: "United Kingdom",
      type: "country",
      lat: 55.3781,
      lng: -3.436,
    },
  },
  {
    keywords: ["usa", "us", "united states", "america"],
    result: {
      label: "United States",
      city: "United States",
      country: "United States",
      type: "country",
      lat: 37.0902,
      lng: -95.7129,
    },
  },
  {
    keywords: ["singapore"],
    result: {
      label: "Singapore",
      city: "Singapore",
      country: "Singapore",
      type: "country",
      lat: 1.3521,
      lng: 103.8198,
    },
  },
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

    if (h === q) score += 180;
    else if (h.startsWith(q)) score += 120;
    else if (h.includes(q)) score += 40;
  }

  const kind = classifyType(item.addresstype, item.type);
  if (kind === "city") score += 45;
  if (kind === "country") score += 35;
  if (kind === "region") score += 20;

  if (!isAllowedPlace(item.addresstype, item.type)) score -= 200;

  return score;
}

function dedupeResults(results: LookupResult[]) {
  const seen = new Set<string>();

  return results.filter((r) => {
    const key = normalizeText(
      `${r.label}|${r.city || ""}|${r.country || ""}|${r.type}`
    );

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getAliasMatches(query: string): LookupResult[] {
  const q = normalizeText(query);

  return DESTINATION_ALIASES.filter((item) =>
    item.keywords.some((keyword) => {
      const k = normalizeText(keyword);
      return k.startsWith(q) || q.startsWith(k);
    })
  ).map((item) => item.result);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

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
        results: aliasMatches.slice(0, 6),
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

        const boostCountries = [
          "united kingdom",
          "japan",
          "australia",
          "indonesia",
          "singapore",
        ];

        let boost = 0;

        if (boostCountries.includes(normalizeText(cleanCountry || ""))) {
          boost += 20;
        }

        if (normalizeText(cleanCity || "") === normalizeText(q)) {
          boost += 60;
        }

        if (normalizeText(cleanCountry || "") === normalizeText(q)) {
          boost += 60;
        }

        if (normalizeText(cleanState || "") === normalizeText(q)) {
          boost += 30;
        }

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

    const deduped = dedupeResults([...aliasMatches, ...mapped]).slice(0, 6);

    if (deduped.length === 0) {
      return NextResponse.json({
        results: [],
        message: "No matching destinations found.",
      });
    }

    return NextResponse.json({ results: deduped });
  } catch {
    return NextResponse.json({
      results: aliasMatches.slice(0, 6),
      message:
        aliasMatches.length === 0 ? "No matching destinations found." : undefined,
    });
  }
}