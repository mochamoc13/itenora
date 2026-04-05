import { NextResponse } from "next/server";

type AgodaSearchParams = {
  destination?: string;
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
  "gold coast": 16611,
};

function normalize(value?: string) {
  return (value || "").trim().toLowerCase();
}

function getCityId(destination?: string): number | null {
  const key = normalize(destination);
  if (!key) return null;

  if (key.includes("gold coast")) return AGODA_CITY_MAP["gold coast"];
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
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function buildFallbackAgodaUrl({
  destination,
  checkIn,
  checkOut,
  adults,
}: {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
}) {
  const url = new URL("https://www.agoda.com/en-au/search");

  url.searchParams.set(
    "cid",
    process.env.NEXT_PUBLIC_AGODA_SITE_ID || process.env.AGODA_SITE_ID || "1961701"
  );

  url.searchParams.set("text", destination || "");

  if (checkIn) url.searchParams.set("checkin", checkIn);
  if (checkOut) url.searchParams.set("checkout", checkOut);

  url.searchParams.set("adults", String(adults || 2));
  url.searchParams.set("rooms", "1");

  return url.toString();
}

async function searchAgoda(params: AgodaSearchParams) {
  const destination = params.destination?.trim();
  const checkIn = params.checkIn;
  const checkOut = params.checkOut;
  const adults = params.adults ?? 2;
  const children = params.children ?? 0;
  const childrenAges = Array.isArray(params.childrenAges)
    ? params.childrenAges
    : [];

  const fallbackUrl = buildFallbackAgodaUrl({
    destination,
    checkIn,
    checkOut,
    adults,
  });

  if (!destination || !checkIn || !checkOut) {
    return {
      ok: false,
      status: 200,
      body: {
        url: fallbackUrl,
        fallback: true,
        reason: "missing_required_fields",
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

  const siteId = process.env.AGODA_SITE_ID;
  const apiKey = process.env.AGODA_API_KEY;
  const cityId = getCityId(destination);

  console.log("Agoda destination:", destination);
  console.log("Agoda mapped cityId:", cityId);

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

  try {
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
        status: 200,
        body: {
          url: fallbackUrl,
          fallback: true,
          reason: "api_error",
        },
      };
    }

    const results: AgodaResult[] = Array.isArray(data?.results) ? data.results : [];
    const best = results[0];

    console.log("Agoda first result:", best);
    console.log("Agoda results count:", results.length);

    if (best?.landingURL && best.landingURL.includes("agoda.com")) {
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
        },
      };
    }

    return {
      ok: false,
      status: 200,
      body: {
        url: fallbackUrl,
        fallback: true,
        reason: "no_valid_landing_url",
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
    const checkIn = searchParams.get("checkIn") || undefined;
    const checkOut = searchParams.get("checkOut") || undefined;
    const adults = Number(searchParams.get("adults") || "2") || 2;
    const debug = searchParams.get("debug") === "1";

    const result = await searchAgoda({
      destination,
      checkIn,
      checkOut,
      adults,
    });

    if (debug) {
      return NextResponse.json(
        {
          destination,
          checkIn,
          checkOut,
          adults,
          result,
        },
        { status: 200 }
      );
    }

    return NextResponse.redirect(result.body.url, 302);
  } catch (error) {
    console.error("Agoda GET route error:", error);
    return NextResponse.redirect("https://www.agoda.com/en-au/search", 302);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AgodaSearchParams;
    const result = await searchAgoda(body);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Agoda POST route error:", error);

    return NextResponse.json(
      { error: "Unexpected Agoda error" },
      { status: 500 }
    );
  }
}