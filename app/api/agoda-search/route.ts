import { NextResponse } from "next/server";
import { AGODA_CITIES } from "@/data/agoda-cities";

type AgodaSearchParams = {
  destination?: string;
  area?: string;
  country?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  childrenAges?: number[];
};

type AgodaResult = {
  hotelId?: number;
  hotelName?: string;
  landingURL?: string;
  reviewScore?: number;
  dailyRate?: number;
  starRating?: number;
  cityName?: string;
  [key: string]: unknown;
};

function normalize(value?: string) {
  return (value || "").trim().toLowerCase();
}

function cleanToken(value?: string) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function firstPart(value?: string) {
  return cleanToken((value || "").split(",")[0]);
}

function isValidDateString(value?: string) {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

const AREA_TO_CITY: Record<string, string> = {
  shibuya: "tokyo",
  shinjuku: "tokyo",
  ueno: "tokyo",
  asakusa: "tokyo",
  akihabara: "tokyo",
  ginza: "tokyo",

  namba: "osaka",
  umeda: "osaka",
  dotonbori: "osaka",
  "shin osaka": "osaka",
  "shin-osaka": "osaka",

  gion: "kyoto",
  "kyoto station": "kyoto",

  orchard: "singapore",
  bugis: "singapore",
  "marina bay": "singapore",
  sentosa: "singapore",
  chinatown: "singapore",

  "darling harbour": "sydney",
  "darling harbor": "sydney",
  cbd: "",
  "south bank": "brisbane",
  southbank: "melbourne",

  myeongdong: "seoul",
  hongdae: "seoul",
  gangnam: "seoul",

  mongkok: "hong kong",
  "mong kok": "hong kong",
  "tsim sha tsui": "hong kong",
  "causeway bay": "hong kong",
  central: "",

  sukhumvit: "bangkok",
  siam: "bangkok",

  seminyak: "bali",
  canggu: "bali",
  ubud: "bali",
  kuta: "bali",

  "bukit bintang": "kuala lumpur",
  klcc: "kuala lumpur",

  "surfers paradise": "gold coast",
  "main beach": "gold coast",
};

function normalizeAreaToCity(value?: string) {
  const raw = normalize(firstPart(value));
  if (!raw) return "";

  if (AREA_TO_CITY[raw] !== undefined) {
    return AREA_TO_CITY[raw];
  }

  return raw;
}

function normalizeDestinationToCity(destination?: string, area?: string) {
  const destinationFirst = normalize(firstPart(destination));
  const areaFirst = normalizeAreaToCity(area);

  const destinationMap: Record<string, string> = {
    tokyo: "tokyo",
    osaka: "osaka",
    kyoto: "kyoto",
    singapore: "singapore",
    sydney: "sydney",
    melbourne: "melbourne",
    brisbane: "brisbane",
    seoul: "seoul",
    bangkok: "bangkok",
    bali: "bali",
    jakarta: "jakarta",
    auckland: "auckland",
    "kuala lumpur": "kuala lumpur",
    "gold coast": "gold coast",
    "hong kong": "hong kong",
    paris: "paris",
    macau: "macau",
    cairo: "cairo",
    milan: "milan",
  };

  if (destinationMap[destinationFirst]) {
    return destinationMap[destinationFirst];
  }

  const destinationLower = normalize(cleanToken(destination));

  for (const [key, value] of Object.entries(destinationMap)) {
    if (destinationLower.includes(key)) {
      return value;
    }
  }

  if (areaFirst) {
    return areaFirst;
  }

  return destinationFirst;
}

function buildFallbackAgodaUrl({
  destination,
  checkIn,
  checkOut,
  adults,
}: {
  destination?: string;
  area?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
}) {
  const base = "https://www.agoda.com/en-au/search";
  const params = new URLSearchParams();

  params.set(
    "cid",
    process.env.NEXT_PUBLIC_AGODA_SITE_ID ||
      process.env.AGODA_SITE_ID ||
      "1961701"
  );

  const cleanedDestination = cleanToken(destination);

  if (cleanedDestination) {
    params.set("textToSearch", cleanedDestination);
  }

  if (checkIn) params.set("checkin", checkIn);
  if (checkOut) params.set("checkout", checkOut);

  params.set("adults", String(adults || 2));
  params.set("rooms", "1");

  return `${base}?${params.toString()}`;
}

function findCityId({
  destination,
  area,
}: {
  destination?: string;
  area?: string;
}): number | null {
  const normalizedDestinationCity = normalizeDestinationToCity(destination, area);
  const normalizedAreaCity = normalizeAreaToCity(area);
  const normalizedDestinationFirst = normalize(firstPart(destination));

  const candidates = [
    normalizedDestinationCity,
    normalizedAreaCity,
    normalizedDestinationFirst,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    const exactMatch = AGODA_CITIES.find(
      (c) => normalize(c.city) === candidate
    );
    if (exactMatch) return exactMatch.cityId;
  }

  for (const candidate of candidates) {
    if (!candidate) continue;

    const partialMatch = AGODA_CITIES.find((c) =>
      normalize(c.city).includes(candidate)
    );
    if (partialMatch) return partialMatch.cityId;
  }

  return null;
}

async function searchAgoda(params: AgodaSearchParams) {
  const destination = cleanToken(params.destination);
  const area = cleanToken(params.area);
  const country = cleanToken(params.country);

  const checkIn = params.checkIn;
  const checkOut = params.checkOut;

  const adults = params.adults ?? 2;
  const children = params.children ?? 0;
  const childrenAges = Array.isArray(params.childrenAges)
    ? params.childrenAges
    : [];

  const fallbackUrl = buildFallbackAgodaUrl({
    destination,
    area,
    checkIn,
    checkOut,
    adults,
  });

  if (!destination) {
    return {
      ok: false,
      status: 200,
      body: {
        url: fallbackUrl,
        fallback: true,
        reason: "missing_destination",
      },
    };
  }

  const siteId = process.env.AGODA_SITE_ID;
  const apiKey = process.env.AGODA_API_KEY;
  const cityId = findCityId({ destination, area });

  console.log("Agoda destination:", destination);
  console.log("Agoda area:", area);
  console.log("Agoda country:", country);
  console.log(
    "Agoda normalized city:",
    normalizeDestinationToCity(destination, area)
  );
  console.log("Agoda mapped cityId:", cityId);
  console.log("Agoda checkIn:", checkIn);
  console.log("Agoda checkOut:", checkOut);

  if (!siteId || !apiKey || !cityId) {
    return {
      ok: false,
      status: 200,
      body: {
        url: fallbackUrl,
        fallback: true,
        reason: "missing_credentials_or_cityid",
      },
    };
  }

  if (!checkIn || !checkOut) {
    return {
      ok: false,
      status: 200,
      body: {
        url: fallbackUrl,
        fallback: true,
        reason: "missing_dates",
      },
    };
  }

  if (!isValidDateString(checkIn) || !isValidDateString(checkOut)) {
    return {
      ok: false,
      status: 200,
      body: {
        url: fallbackUrl,
        fallback: true,
        reason: "invalid_dates",
      },
    };
  }

  try {
    const payload = {
      criteria: {
        additional: {
          currency: "AUD",
          language: "en-au",
          maxResult: 10,
          sortBy: "Recommended",
          occupancy: {
            numberOfAdult: adults,
            numberOfChildren: children,
            ...(children > 0 && childrenAges.length === children
              ? { childrenAges }
              : {}),
          },
        },
        checkInDate: checkIn,
        checkOutDate: checkOut,
        cityId,
      },
    };

    console.log("Agoda payload:", JSON.stringify(payload));

    const response = await fetch(
      "http://affiliateapi7643.agoda.com/affiliateservice/lt_v1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${siteId}:${apiKey}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Agoda API status:", response.status);
      console.error("Agoda API body:", data);

      return {
        ok: false,
        status: 200,
        body: {
          url: fallbackUrl,
          fallback: true,
          reason: "api_error",
        },
      };
    }

    const results: AgodaResult[] = Array.isArray(data?.results)
      ? data.results
      : [];

    const best = results[0];

    return {
      ok: true,
      status: 200,
      body: {
        url: fallbackUrl,
        recommendedHotelUrl: best?.landingURL || null,
        hotelName: best?.hotelName || null,
        reviewScore: best?.reviewScore || null,
        dailyRate: best?.dailyRate || null,
        starRating: best?.starRating || null,
        cityId,
        rawCount: results.length,
      },
    };
  } catch (error) {
    console.error("Agoda API error:", error);

    return {
      ok: false,
      status: 200,
      body: {
        url: fallbackUrl,
        fallback: true,
        reason: "unexpected_error",
      },
    };
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const destination = searchParams.get("destination") || undefined;
    const area = searchParams.get("area") || undefined;
    const country = searchParams.get("country") || undefined;
    const checkIn = searchParams.get("checkIn") || undefined;
    const checkOut = searchParams.get("checkOut") || undefined;
    const adults = Number(searchParams.get("adults") || "2") || 2;
    const children = Number(searchParams.get("children") || "0") || 0;

    const childrenAgesParam = searchParams.get("childrenAges");
    const childrenAges = childrenAgesParam
      ? childrenAgesParam
          .split(",")
          .map((v) => Number(v.trim()))
          .filter((v) => Number.isFinite(v) && v >= 0)
      : [];

    const debug = searchParams.get("debug") === "1";

    const result = await searchAgoda({
      destination,
      area,
      country,
      checkIn,
      checkOut,
      adults,
      children,
      childrenAges,
    });

    if (debug) {
      return NextResponse.json({
        input: {
          destination,
          area,
          country,
          checkIn,
          checkOut,
          adults,
          children,
          childrenAges,
        },
        result,
      });
    }

    return NextResponse.redirect(result.body.url, 302);
  } catch (error) {
    console.error("Agoda GET error:", error);
    return NextResponse.redirect("https://www.agoda.com/en-au/search", 302);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AgodaSearchParams;

    const normalizedBody: AgodaSearchParams = {
      ...body,
      children:
        typeof body.children === "number"
          ? body.children
          : Number(body.children || 0) || 0,
      childrenAges: Array.isArray(body.childrenAges)
        ? body.childrenAges
            .map((v) => Number(v))
            .filter((v) => Number.isFinite(v) && v >= 0)
        : [],
    };

    const result = await searchAgoda(normalizedBody);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Agoda POST error:", error);

    return NextResponse.json(
      { error: "Unexpected Agoda error" },
      { status: 500 }
    );
  }
}