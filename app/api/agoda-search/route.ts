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

  return null;
}

function isValidDateString(value?: string) {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// ✅ FIXED: direct Agoda search (NO API issues)
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
    process.env.NEXT_PUBLIC_AGODA_SITE_ID || "1961701"
  );

  // 🔥 KEY FIX → use "text" NOT "city"
  url.searchParams.set("text", destination || "");

  if (checkIn) url.searchParams.set("checkin", checkIn);
  if (checkOut) url.searchParams.set("checkout", checkOut);

  url.searchParams.set("adults", String(adults || 2));
  url.searchParams.set("rooms", "1");

  return url.toString();
}

async function searchAgoda(params: AgodaSearchParams) {
  const destination = params.destination?.trim();
  const area = params.area?.trim();
  const checkIn = params.checkIn;
  const checkOut = params.checkOut;
  const adults = params.adults ?? 2;

  const fallbackUrl = buildFallbackAgodaUrl({
    destination,
    checkIn,
    checkOut,
    adults,
  });

  // 🔥 IMPORTANT: if anything missing → use fallback immediately
  if (!destination || !checkIn || !checkOut) {
    return {
      ok: false,
      status: 200,
      body: {
        url: fallbackUrl,
        fallback: true,
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
      },
    };
  }

  const cityId = getCityId(destination);

  console.log("Agoda destination:", destination);
  console.log("Agoda area:", area);
  console.log("Agoda mapped cityId:", cityId);

  // 🔥 If mapping fails → fallback
  if (!cityId) {
    return {
      ok: false,
      status: 200,
      body: {
        url: fallbackUrl,
        fallback: true,
      },
    };
  }

  try {
    const siteId = process.env.AGODA_SITE_ID;
    const apiKey = process.env.AGODA_API_KEY;

    if (!siteId || !apiKey) {
      return {
        ok: false,
        status: 200,
        body: {
          url: fallbackUrl,
          fallback: true,
        },
      };
    }

    const response = await fetch(
      "http://affiliateapi7643.agoda.com/affiliateservice/lt_v1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${siteId}:${apiKey}`,
        },
        body: JSON.stringify({
          criteria: {
            checkInDate: checkIn,
            checkOutDate: checkOut,
            cityId,
            additional: {
              currency: "AUD",
              language: "en-au",
              occupancy: {
                numberOfAdult: adults,
              },
            },
          },
        }),
      }
    );

    const data = await response.json().catch(() => null);
    const best = data?.results?.[0];

    console.log("Agoda first result:", best);

    // 🔥 CRITICAL FIX → only use API if URL is VALID
    if (best?.landingURL && best.landingURL.includes("agoda.com")) {
      return {
        ok: true,
        status: 200,
        body: {
          url: best.landingURL,
        },
      };
    }

    // fallback if API unreliable
    return {
      ok: false,
      status: 200,
      body: {
        url: fallbackUrl,
        fallback: true,
      },
    };
  } catch (err) {
    console.error("Agoda API error:", err);

    return {
      ok: false,
      status: 200,
      body: {
        url: fallbackUrl,
        fallback: true,
      },
    };
  }
}

// ✅ GET (used by your buttons)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const destination = searchParams.get("destination") || undefined;
    const area = searchParams.get("area") || undefined;
    const checkIn = searchParams.get("checkIn") || undefined;
    const checkOut = searchParams.get("checkOut") || undefined;
    const adults = Number(searchParams.get("adults") || "2");

    const result = await searchAgoda({
      destination,
      area,
      checkIn,
      checkOut,
      adults,
    });

    return NextResponse.redirect(result.body.url, 302);
  } catch (error) {
    console.error("Agoda GET route error:", error);

    return NextResponse.redirect(
      "https://www.agoda.com/en-au/search",
      302
    );
  }
}

// POST (optional)
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