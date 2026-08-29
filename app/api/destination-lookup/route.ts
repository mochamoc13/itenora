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

const BLOCKED_BROAD = new Set([
  "europe",
  "asia",
  "africa",
  "america",
  "north america",
  "south america",
  "antarctica",
  "oceania",
]);

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
    if (h === q) score += 120;
    else if (h.startsWith(q)) score += 80;
    else if (h.includes(q)) score += 40;
  }

  const kind = classifyType(item.addresstype, item.type);
  if (kind === "city") score += 40;
  if (kind === "country") score += 30;
  if (kind === "region") score += 10;

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const normalizedQ = normalizeText(q);

  if (BLOCKED_BROAD.has(normalizedQ)) {
    return NextResponse.json({
      results: [],
      message: "Please choose a specific city or country.",
    });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "12");

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
    .filter((item) => isAllowedPlace(item.addresstype, item.type))
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

      const result: LookupResult = {
        label: item.display_name,
        city,
        state,
        country,
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

  if (deduped.length === 0) {
    return NextResponse.json({
      results: [],
      message: "Please choose a specific city or country.",
    });
  }

  return NextResponse.json({ results: deduped });
}