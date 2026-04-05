import { NextResponse } from "next/server";

type AgodaSearchParams = {
  destination?: string;
  area?: string;
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

// IMPORTANT:
// These are placeholders until you confirm Agoda's official city IDs
// from their hotel/city data file in the Agoda partner portal.
const AGODA_CITY_MAP: Record<string, number> = {
  tokyo: 5085,
  osaka: 9590,
  kyoto: 1784,
  singapore: 4064,
  bangkok: 9395,
  seoul: 14690,
  bali: 17193,
  jakarta: 8691,
  sydney: 14370,
  melbourne: 10372,
  brisbane: 9466,
  auckland: 3750,
  "kuala lumpur": 14524,
  adelaide: 11981,
};

function normalize(value?: string) {
  return (value || "").trim().toLowerCase();
}

function getCityId(destination?: string): number | null {
  const key = normalize(destination);

  if (!key) return null;

  // safer matching for values like "Tokyo, Japan"
  if (key.includes("tokyo")) return AGODA_CITY_MAP["tokyo"];
  if (key.includes("osaka")) return AGODA_CITY_MAP["osaka"];
  if (key.includes("kyoto")) return AGODA_CITY_MAP["kyoto"];
  if (key.includes("singapore")) return AGODA_CITY_MAP["singapore"];
  if (key.includes("bangkok")) return AGODA_CITY_MAP["bangkok"];
  if (key.includes("seoul")) return AGODA_CITY_MAP["seoul"];
  if (key.includes("bali")) return AGODA_CITY_MAP["bali"];
  if (key.includes("jakarta")) return AGODA_CITY_MAP["jakarta"];
  if (key.includes("sydney")) return AGODA_CITY_MAP["sydney"];
  if (key.includes("melbourne")) return AGODA_CITY_MAP["melbourne"];
  if (key.includes("brisbane")) return AGODA_CITY_MAP["brisbane"];
  if (key.includes("auckland")) return AGODA_CITY_MAP["auckland"];
  if (key.includes("kuala lumpur")) return AGODA_CITY_MAP["kuala lumpur"];
  if (key.includes("adelaide")) return AGODA_CITY_MAP["adelaide"];

  if (key === "japan") return AGODA_CITY_MAP["tokyo"];
  if (key === "indonesia") return AGODA_CITY_MAP["bali"];
  if (key === "australia") return AGODA_CITY_MAP["sydney"];
  if (key === "south korea" || key === "korea") return AGODA_CITY_MAP["seoul"];
  if (key === "thailand") return AGODA_CITY_MAP["bangkok"];

  return null;
}

function isValidDateString(value?: string) {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function buildFallbackAgodaUrl(params: {
  destination?: string;
  area?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
}) {
  const { destination, area, checkIn, checkOut, adults = 2 } = params;

  const query = [area, destination].filter(Boolean).join(", ").trim();
  const finalQuery = query || destination || "";

  const url = new URL("https://www.agoda.com/search");

  if (finalQuery) {
    url.searchParams.set("textToSearch", finalQuery);
  }

  if (checkIn) url.searchParams.set("checkIn", checkIn);
  if (checkOut) url.searchParams.set("checkOut", checkOut);

  url.searchParams.set("rooms", "1");
  url.searchParams.set("adults", String(adults));

  return url.toString();
}

async function searchAgoda(params: AgodaSearchParams) {
  const destination = params.destination?.trim();
  const area = params.area?.trim();
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

  if (!destination || !checkIn || !checkOut) {
    return {
      ok: false,
      status: 400,
      body: {
        error: "destination, checkIn, and checkOut are required",
        fallbackUrl,
      },
    };
  }

  if (!isValidDateString(checkIn) || !isValidDateString(checkOut)) {
    return {
      ok: false,
      status: 400,
      body: {
        error: "checkIn and checkOut must be YYYY-MM-DD",
        fallbackUrl,
      },
    };
  }

  const siteId = process.env.AGODA_SITE_ID;
  const apiKey = process.env.AGODA_API_KEY;

  if (!siteId || !apiKey) {
    return {
      ok: false,
      status: 500,
      body: {
        error: "Missing Agoda API credentials",
        fallbackUrl,
      },
    };
  }

  const cityId = getCityId(destination);

  console.log("Agoda destination:", destination);
  console.log("Agoda area:", area);
  console.log("Agoda mapped cityId:", cityId);

  if (!cityId) {
    return {
      ok: false,
      status: 400,
      body: {
        error: `No Agoda city mapping found for ${destination}`,
        fallbackUrl,
      },
    };
  }

  const payload = {
    criteria: {
      additional: {
        currency: "AUD",
        language: "en-au",
        maxResult: 10,
        sortBy: "Recommended",
        discountOnly: false,
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

  console.log("Agoda request payload:", JSON.stringify(payload));

  const response = await fetch(
    "http://affiliateapi7643.agoda.com/affiliateservice/lt_v1",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip,deflate",
        Authorization: `${siteId}:${apiKey}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Agoda API error status:", response.status);
    console.error("Agoda API error body:", data);

    return {
      ok: false,
      status: 502,
      body: {
        error: "Agoda API request failed",
        details: data,
        fallbackUrl,
      },
    };
  }

  const results: AgodaResult[] = Array.isArray(data?.results) ? data.results : [];
  const best = results[0];

  console.log("Agoda first result:", best);
  console.log("Agoda results count:", results.length);

  if (!best?.landingURL) {
    return {
      ok: false,
      status: 404,
      body: {
        error: "No Agoda results found",
        details: data,
        fallbackUrl,
      },
    };
  }

  return {
    ok: true,
    status: 200,
    body: {
      url: best.landingURL,
      hotelName: best.hotelName || null,
      hotelId: best.hotelId || null,
      reviewScore: best.reviewScore || null,
      dailyRate: best.dailyRate || null,
      starRating: best.starRating || null,
      rawCount: results.length,
      fallbackUrl,
    },
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AgodaSearchParams;
    const result = await searchAgoda(body);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Agoda POST route error:", error);
    return NextResponse.json(
      { error: "Unexpected Agoda search error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const destination = searchParams.get("destination") || undefined;
    const area = searchParams.get("area") || undefined;
    const checkIn = searchParams.get("checkIn") || undefined;
    const checkOut = searchParams.get("checkOut") || undefined;
    const adults = Number(searchParams.get("adults") || "2") || 2;
    const debug = searchParams.get("debug") === "1";

    const result = await searchAgoda({
      destination,
      area,
      checkIn,
      checkOut,
      adults,
    });

    if (debug) {
      return NextResponse.json(
        {
          destination,
          area,
          checkIn,
          checkOut,
          adults,
          result,
        },
        { status: 200 }
      );
    }

    const targetUrl =
      result.ok && typeof result.body.url === "string"
        ? result.body.url
        : (result.body as { fallbackUrl?: string }).fallbackUrl ||
          buildFallbackAgodaUrl({
            destination,
            area,
            checkIn,
            checkOut,
            adults,
          });

    return NextResponse.redirect(targetUrl, 302);
  } catch (error) {
    console.error("Agoda GET route error:", error);
    return NextResponse.redirect("https://www.agoda.com/search", 302);
  }
}