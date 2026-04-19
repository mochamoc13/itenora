import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  addDays,
  buildHotelAffiliateLink,
  buildKlookActivityLink,
  isBookableActivity,
  isTopAttraction,
} from "@/lib/affiliate";

type PageProps = {
  params: { slug: string };
};

function isValidDateString(value?: string | null) {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getShortHotelLabel(value?: string) {
  const text = cleanText(value);
  if (!text) return "";

  return text
    .split(",")[0]
    .replace(/\(.*?\)/g, "")
    .trim();
}

function getMeaningfulStayArea(stops: any[], destination: string) {
  if (!Array.isArray(stops)) return "";

  const destinationLower = cleanText(destination).toLowerCase();

  for (const stop of stops) {
    const area = cleanText(stop?.area);
    if (!area) continue;

    const areaLower = area.toLowerCase();

    if (destinationLower && areaLower === destinationLower) continue;

    if (
      areaLower === "city center" ||
      areaLower === "city centre" ||
      areaLower === "downtown" ||
      areaLower === "central"
    ) {
      continue;
    }

    return area;
  }

  return "";
}

function getCountryFromDestination(destination: string) {
  const cleaned = cleanText(destination);

  const parts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return parts[parts.length - 1];
  }

  const d = cleaned.toLowerCase();

  if (d.includes("tokyo") || d.includes("osaka") || d.includes("kyoto")) {
    return "Japan";
  }

  if (d.includes("singapore")) return "Singapore";

  if (
    d.includes("sydney") ||
    d.includes("melbourne") ||
    d.includes("brisbane") ||
    d.includes("gold coast")
  ) {
    return "Australia";
  }

  if (d.includes("seoul") || d.includes("busan") || d.includes("jeju")) {
    return "South Korea";
  }

  if (d.includes("bangkok")) return "Thailand";

  if (d.includes("bali") || d.includes("jakarta")) {
    return "Indonesia";
  }

  if (d.includes("auckland")) return "New Zealand";
  if (d.includes("kuala lumpur")) return "Malaysia";
  if (d.includes("hong kong")) return "Hong Kong";

  return "";
}


function getTripDays(input: any, itinerary: any[]) {
  if (typeof input?.days === "number" && input.days > 0) return input.days;
  if (Array.isArray(itinerary) && itinerary.length > 0) return itinerary.length;
  return null;
}

function buildFallbackTitle(destination: string, input: any, itinerary: any[]) {
const days = getTripDays(input, itinerary);

  const people = cleanText(input?.people);
  const audience =
    people === "family"
      ? " for Families"
      : people === "couple"
        ? " for Couples"
        : people === "solo"
          ? " for Solo Travellers"
          : "";

  if (days && destination) {
    return `${days} Day ${destination} Itinerary${audience} (2026)`;
  }

  return destination ? `${destination} Itinerary` : "Travel Itinerary";
}

function buildFallbackDescription(destination: string, input: any, itinerary: any[]) {
  const days = getTripDays(input, itinerary);

  const people = cleanText(input?.people);
  const audience =
    people === "family"
      ? "for families"
      : people === "couple"
        ? "for couples"
        : people === "solo"
          ? "for solo travellers"
          : "for travellers";

  if (days && destination) {
    return `Plan the perfect ${days}-day ${destination} itinerary ${audience}. Includes attractions, food spots, and practical day-by-day planning ideas.`;
  }

  if (destination) {
    return `Plan your ${destination} itinerary with attractions, food stops, and practical day-by-day planning ideas.`;
  }

  return "Shared itinerary page on Itenora.";
}

function containsWrongDayLabel(text: string, actualDays: number | null) {
  if (!text || !actualDays) return false;

  const normalized = text.toLowerCase();

  for (let i = 1; i <= 30; i++) {
    if (i === actualDays) continue;

    if (
      normalized.includes(`${i}-day`) ||
      normalized.includes(`${i} day`)
    ) {
      return true;
    }
  }

  return false;
}

function getDayHeading(day: any, index: number) {
  const theme = cleanText(day?.theme);
  return `Day ${day?.day ?? index + 1}${theme ? ` — ${theme}` : ""}`;
}

function getAreaSummary(area: string, destination: string) {
  if (!area) {
    return `Browse hotel options for ${destination}.`;
  }

  return `${area} is a practical base for this itinerary with easier access to nearby stops.`;
}

function buildAgodaBackupLink(params: {
  destination?: string;
  country?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
}) {
  const { destination, country, checkIn, checkOut, adults } = params;

  const searchParams = new URLSearchParams();

  const cleanedDestination = cleanText(destination);
  const cleanedCountry = cleanText(country);

  if (cleanedDestination) {
    searchParams.set("destination", cleanedDestination);
  }

  if (cleanedCountry) {
    searchParams.set("country", cleanedCountry);
  }

  if (checkIn) {
    searchParams.set("checkIn", checkIn);
  }

  if (checkOut) {
    searchParams.set("checkOut", checkOut);
  }

  searchParams.set("adults", String(adults || 2));

  return `/api/agoda-search?${searchParams.toString()}`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = createSupabaseServerClient();

  const { data: trip } = await supabase
    .from("itineraries")
    .select("title, destination, slug, generated_plan")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!trip) {
    return {
      title: "Trip not found | Itenora",
      description: "Shared itinerary page on Itenora.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const input = trip.generated_plan?.input ?? {};
  const itinerary = Array.isArray(trip.generated_plan?.itinerary)
    ? trip.generated_plan.itinerary
    : [];
  const seo = trip.generated_plan?.seo ?? {};

  const destination = cleanText(trip.destination || input.destination || "");
const days = getTripDays(input, itinerary);

const fallbackTitle = buildFallbackTitle(destination, input, itinerary);
const fallbackDescription = buildFallbackDescription(destination, input, itinerary);

const rawH1 = cleanText(seo.h1);
const rawSeoTitle = cleanText(seo.seoTitle);
const rawSeoDescription = cleanText(seo.seoDescription);

const h1 =
  rawH1 && !containsWrongDayLabel(rawH1, days)
    ? rawH1
    : cleanText(trip.title) || fallbackTitle;

const seoTitle =
  rawSeoTitle && !containsWrongDayLabel(rawSeoTitle, days)
    ? rawSeoTitle
    : cleanText(trip.title) || h1;

const seoDescription =
  rawSeoDescription && !containsWrongDayLabel(rawSeoDescription, days)
    ? rawSeoDescription
    : fallbackDescription;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://itenora.com";
  const canonicalUrl = `${siteUrl}/trips/share/${params.slug}`;
  const pageTitle = seoTitle.includes("| Itenora")
    ? seoTitle
    : `${seoTitle} | Itenora`;

  return {
    title: pageTitle,
    description: seoDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: seoDescription,
      url: canonicalUrl,
      siteName: "Itenora",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: seoDescription,
    },
  };
}

export default async function PublicTripPage({ params }: PageProps) {
  const supabase = createSupabaseServerClient();

  const { data: trip } = await supabase
    .from("itineraries")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!trip) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Trip not found</h1>
          <p className="mt-3 text-gray-600">
            This itinerary may have expired or is no longer available.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-black px-6 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            Plan your own trip
          </Link>
        </div>
      </main>
    );
  }

  const input = trip.generated_plan?.input ?? {};
  const itinerary = Array.isArray(trip.generated_plan?.itinerary)
    ? trip.generated_plan.itinerary
    : [];
  const seo = trip.generated_plan?.seo ?? {};

  const destination = cleanText(trip.destination || input.destination || "");
  const tripCountry = getCountryFromDestination(destination);
const days = getTripDays(input, itinerary);

 const rawTitle = cleanText(seo.h1);

const title =
  rawTitle && !containsWrongDayLabel(rawTitle, days)
    ? rawTitle
    : cleanText(trip.title) || buildFallbackTitle(destination, input, itinerary);

const audienceLabel =
  cleanText(input?.people) === "family"
    ? "family"
    : cleanText(input?.people) === "couple"
      ? "couple"
      : cleanText(input?.people) === "solo"
        ? "solo"
        : "travel";

const normalizedDestination = destination.toLowerCase();

const isBaliPage = normalizedDestination.includes("bali");

const isJapanPage =
  normalizedDestination.includes("japan") ||
  normalizedDestination.includes("tokyo") ||
  normalizedDestination.includes("osaka") ||
  normalizedDestination.includes("kyoto");

const introParagraph = isBaliPage
  ? "Planning a 5-day Bali itinerary for solo travel on a budget? This guide covers the best places to visit in Bali including Uluwatu, Ubud, rice terraces, temples, and hidden gems — all organised into a simple, stress-free 5-day plan."
  : isJapanPage
    ? "Planning a Japan itinerary? This guide helps you explore the best attractions, food spots, and practical day-by-day travel ideas without spending hours planning everything yourself."
    : days
      ? `Planning a ${days}-day ${destination || "trip"} itinerary? This guide features a practical mix of attractions, memorable stops, and day-by-day travel ideas to make your trip easier.`
      : `Planning a trip to ${destination || "your destination"}? This itinerary gives you practical day-by-day ideas to make travel planning easier.`;
 const seoOverviewBullets = cleanStringArray(seo.overviewBullets);

const generatedOverviewBullets = itinerary.map((day: any, index: number) => {
  const stops = Array.isArray(day?.stops) ? day.stops : [];

  const stopTitles = stops
    .slice(0, 2)
    .map((stop: any) => cleanText(stop?.title))
    .filter(Boolean);

  if (stopTitles.length > 0) {
    return `Day ${day?.day ?? index + 1}: ${stopTitles.join(" and ")}.`;
  }

  const theme = cleanText(day?.theme);
  if (theme) {
    return `Day ${day?.day ?? index + 1}: Enjoy ${theme.toLowerCase()}.`;
  }

  return `Day ${day?.day ?? index + 1}: Explore ${destination}.`;
});

const overviewBullets =
  seoOverviewBullets.length === itinerary.length && itinerary.length > 0
    ? seoOverviewBullets
    : generatedOverviewBullets;

  

  const people = cleanText(input.people);
  const adults = people === "solo" ? 1 : people === "couple" ? 2 : 2;

  const startDate = trip.start_date ?? input.startDate ?? undefined;
  const hasValidStartDate = isValidDateString(startDate);

  const endDate =
    trip.end_date ??
    (startDate && days ? addDays(startDate, Math.max(days, 1)) : undefined);

  const firstDayStops = Array.isArray(itinerary?.[0]?.stops)
    ? itinerary[0].stops
    : [];
  const topStayArea = getMeaningfulStayArea(firstDayStops, destination);
  const topStayLabel = getShortHotelLabel(topStayArea || destination);
  const topHotelButtonLabel =
    getShortHotelLabel(topStayArea) || getShortHotelLabel(destination);

  const hotelLink = buildHotelAffiliateLink({
    destination,
    area: topStayArea || undefined,
    checkIn: startDate,
    checkOut: endDate,
    adults,
  });

  const agodaHotelLink = buildAgodaBackupLink({
    destination,
    country: tripCountry || undefined,
    checkIn: startDate,
    checkOut: endDate,
    adults,
  });

  const { data: relatedTrips } = await supabase
    .from("itineraries")
    .select("slug, title, generated_plan")
    .eq("destination", trip.destination)
    .neq("slug", params.slug)
    .not("slug", "is", null)
    .limit(5);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://itenora.com";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TravelItinerary",
    name: title,
 description:
  cleanText(seo.seoDescription) &&
  !containsWrongDayLabel(cleanText(seo.seoDescription), days)
    ? cleanText(seo.seoDescription)
    : buildFallbackDescription(destination, input, itinerary),
    url: `${siteUrl}/trips/share/${params.slug}`,
    itinerary: itinerary.map((day: any, index: number) => ({
      "@type": "ListItem",
      name: getDayHeading(day, index),
      description: Array.isArray(day.stops)
        ? day.stops
            .map(
              (stop: any) =>
                `${stop.time ?? "Anytime"} ${stop.title ?? "Stop"}`
            )
            .join(", ")
        : "",
    })),
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <article className="space-y-8">
        <header className="rounded-3xl border border-black/10 bg-gradient-to-br from-purple-50 via-white to-orange-50 p-6 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h1>

          <p className="mt-3 text-base leading-7 text-gray-700">
            {introParagraph}
          </p>

      <p className="mt-2 text-sm leading-6 text-gray-600">
  {isBaliPage
    ? "Perfect for solo travellers, this itinerary helps you save money, avoid tourist traps, and make the most of your time in Bali without overplanning."
    : isJapanPage
      ? "Perfect for first-time visitors, couples, families, or solo travellers who want a smoother and more practical Japan trip."
      : "Updated for 2026 travel. Use this itinerary as a flexible travel guide for what to do, where to go, and how to organise each day more smoothly."}
</p>

          <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
            {days ? (
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
                {days} day{days > 1 ? "s" : ""}
              </span>
            ) : null}

            {trip.budget ? (
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
                {trip.budget}
              </span>
            ) : null}

            {startDate ? (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                Hotel-ready
              </span>
            ) : null}
          </div>
        </header>

        {overviewBullets.length > 0 ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              {destination
                ? `${destination} itinerary overview`
                : "Itinerary overview"}
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-700">
  {overviewBullets.map((item: string, index: number) => (
    <li key={index} className="flex gap-2">
      <span className="mt-1 text-gray-400">•</span>
      <span>{item}</span>
    </li>
  ))}
</ul>
          </section>
        ) : null}

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            Tip: Open maps, hotel, or activity links in a new tab so your
            itinerary stays open.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            This is especially helpful if you opened the trip from Instagram or
            Facebook.
          </p>
        </div>

        {destination ? (
          <section className="rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-900">
                  Recommended area
                </p>

                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {topStayLabel}
                </h2>

                <p className="mt-2 text-sm leading-6 text-orange-900/85">
                  {getAreaSummary(topStayArea, destination)}
                </p>

                <p className="mt-2 text-xs text-gray-600">
                  Use the main hotel button for the best match. Agoda is
                  available as a backup option.
                </p>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[320px]">
                <a
                  href={hotelLink}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  Find hotels in {topHotelButtonLabel || "this area"}
                </a>

                <a
                  href={agodaHotelLink}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex items-center justify-center rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100"
                >
                  More hotel options on Agoda
                </a>

                <span className="text-xs text-gray-600">
                  Both links open in a new tab
                </span>
              </div>
            </div>
          </section>
        ) : null}

        {itinerary.length > 0 ? (
          itinerary.map((day: any, index: number) => {
            const dayStops = Array.isArray(day.stops) ? day.stops : [];
            const meaningfulArea = getMeaningfulStayArea(dayStops, destination);
            const dayStayLabel =
              getShortHotelLabel(meaningfulArea) ||
              getShortHotelLabel(destination);
            const dayHotelButtonLabel =
              getShortHotelLabel(meaningfulArea) ||
              getShortHotelLabel(destination);

            const checkIn =
              hasValidStartDate && startDate
                ? addDays(startDate, index)
                : undefined;

            const checkOut =
              hasValidStartDate && startDate
                ? addDays(startDate, index + 1)
                : undefined;

            const dayHotelLink = buildHotelAffiliateLink({
              destination,
              area: meaningfulArea || undefined,
              checkIn,
              checkOut,
              adults,
            });

            const dayAgodaLink = buildAgodaBackupLink({
              destination,
              country: tripCountry || undefined,
              checkIn,
              checkOut,
              adults,
            });

            return (
              <section
                key={day.day ?? index}
                className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {getDayHeading(day, index)}
                    </h2>

                    {day.date ? (
                      <p className="mt-1 text-sm text-gray-500">{day.date}</p>
                    ) : null}
                  </div>

                  {typeof day.dailyCostEstimate === "number" ? (
                    <div className="text-sm text-gray-500">
                      Daily est. total: ~{day.dailyCostEstimate}
                    </div>
                  ) : null}
                </div>

                {destination ? (
                  <div className="mb-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 max-w-2xl">
                        <p className="text-sm font-semibold text-orange-900">
                          Recommended area: {dayStayLabel}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-orange-800">
                          {getAreaSummary(meaningfulArea, destination)}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          Search hotels in {dayHotelButtonLabel || "this area"}
                          {checkIn && checkOut
                            ? ` from ${checkIn} to ${checkOut}`
                            : ""}
                          .
                        </p>
                      </div>

                      <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[280px]">
                        <a
                          href={dayHotelLink}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
                        >
                          Find hotels in {dayHotelButtonLabel || "this area"}
                        </a>

                        <a
                          href={dayAgodaLink}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="inline-flex items-center justify-center rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100"
                        >
                          Browse Agoda hotels
                        </a>

                        <span className="text-xs text-gray-600">
                          Opens in a new tab
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-4">
                  {dayStops.length > 0 ? (
                    dayStops.map((stop: any, i: number) => {
                      const mapQuery =
                        stop.mapQuery ||
                        `${stop.title || "Stop"}, ${destination}`;
                      const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
                        mapQuery
                      )}`;

                      return (
                        <div
                          key={i}
                          className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                {stop.time || "Anytime"}
                                {stop.area ? ` • ${stop.area}` : ""}
                              </div>

                              {isTopAttraction(stop.title) ? (
                                <div className="mb-1 mt-1 text-xs font-semibold text-red-500">
                                  🔥 Top attraction
                                </div>
                              ) : null}

                              <h3 className="mt-1 text-lg font-semibold text-gray-900">
                                {stop.title || "Recommended stop"}
                              </h3>

                              {stop.notes ? (
                                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                                  {stop.notes}
                                </p>
                              ) : (
                                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                                  A suggested stop for this part of the
                                  itinerary.
                                </p>
                              )}
                            </div>

                            {typeof stop.costEstimate === "number" ? (
                              <div className="text-sm text-gray-500">
                                ~{stop.costEstimate}
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-4">
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              Open on Google Maps
                            </a>

                            {isBookableActivity(stop.title) ? (
                              <a
                                href={buildKlookActivityLink(
                                  stop.title,
                                  destination
                                )}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-medium transition ${
                                  isTopAttraction(stop.title)
                                    ? "bg-red-500 text-white hover:bg-red-600"
                                    : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                }`}
                              >
                                {isTopAttraction(stop.title)
                                  ? "🔥 Most popular — check price"
                                  : "Check price on Klook"}
                              </a>
                            ) : null}

                            <span className="w-full text-xs text-gray-500">
                              Opens in a new tab so you can keep this itinerary
                              open.
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-600">
                      No stops listed for this day yet.
                    </p>
                  )}
                </div>
              </section>
            );
          })
        ) : (
          <section className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Itinerary details
            </h2>
            <p className="mt-3 text-gray-600">
              No itinerary details are currently available for this trip.
            </p>
          </section>
        )}

        {relatedTrips && relatedTrips.length > 0 ? (
          <section className="border-t pt-10">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              More {destination} itineraries
            </h2>

            <ul className="space-y-2">
              {relatedTrips.map((r: any) => {
                const relatedSeo = r.generated_plan?.seo ?? {};
                const relatedTitle =
                  cleanText(relatedSeo.h1) ||
                  cleanText(r.title) ||
                  "Related itinerary";

                return (
                  <li key={r.slug}>
                    <Link
                      href={`/trips/share/${r.slug}`}
                      className="text-blue-600 hover:underline"
                    >
                      {relatedTitle}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <footer className="border-t pt-10 text-center">
          <p className="text-gray-600">
            ✨ This itinerary was generated by Itenora AI
          </p>

          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-black px-6 py-3 text-white"
          >
            Plan your own trip
          </Link>
        </footer>
      </article>
    </main>
  );
}