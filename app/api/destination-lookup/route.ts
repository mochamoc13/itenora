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

  const county = address.county || "";
  const state = address.state || address.region || "";
  const country = address.country || "";
  const display = item.display_name || "";

  const haystacks = [city, county, state, country, display].map(normalizeText);

  let score = 0;

  for (const h of haystacks) {
    if (!h) continue;

    if (h === q) score += 200;
    else if (h.startsWith(q)) score += 120;
    else if (h.includes(q)) score += 40;
  }

  const kind = classifyType(item.addresstype, item.type);

  if (kind === "city") score += 40;
  if (kind === "region") score += 20;
  if (kind === "country") score += 15;

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "itenora/1.0",
        "Accept-Language": "en",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const raw = await res.json();
    const list = Array.isArray(raw) ? raw : [];

    const mapped = list
      .filter((item) => {
        if (!isAllowedPlace(item.addresstype, item.type)) return false;

        const t = classifyType(item.addresstype, item.type);
        return t === "city" || t === "country" || t === "region" || t === "place";
      })
      .map((item) => {
        const address = item.address || {};

        const city =
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          address.hamlet ||
          undefined;

        const state =
          address.state ||
          address.region ||
          address.county ||
          undefined;

        const country = address.country || undefined;
        const type = classifyType(item.addresstype, item.type);

        const cleanCity = city?.trim();
        const cleanState = state?.trim();
        const cleanCountry = country?.trim();

        let label = item.display_name;

        if (cleanCity && cleanState && cleanCountry) {
          label = `${cleanCity}, ${cleanState}, ${cleanCountry}`;
        } else if (cleanCity && cleanCountry) {
          label = `${cleanCity}, ${cleanCountry}`;
        } else if (cleanState && cleanCountry) {
          label = `${cleanState}, ${cleanCountry}`;
        } else if (cleanCountry) {
          label = cleanCountry;
        } else if (cleanCity) {
          label = cleanCity;
        }

        const result: LookupResult = {
          label,
          city: cleanCity,
          state: cleanState,
          country: cleanCountry,
          type,
          lat: item.lat ? Number(item.lat) : undefined,
          lng: item.lon ? Number(item.lon) : undefined,
        };

        return {
          result,
          score: scoreResult(item, q),
        };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.result);

    const deduped = dedupeResults(mapped).slice(0, 6);

    return NextResponse.json({ results: deduped });
  } catch {
    return NextResponse.json({ results: [] });
  }
}