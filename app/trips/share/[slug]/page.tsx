import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import {
  addDays,
  buildHotelAffiliateLink,
  buildBookingAffiliateLink,
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = createSupabaseServerClient();

  const { data: trip } = await supabase
    .from("itineraries")
    .select("title, destination, budget, slug")
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://itenora.com";
  const title = trip.title || `${trip.destination} itinerary`;
  const description = `This itinerary for ${trip.destination} includes day-by-day suggestions, attractions, food stops, and practical planning ideas to make the trip easier.`;

  return {
    title: `${title} | Itenora`,
    description,
    alternates: {
      canonical: `${siteUrl}/trips/share/${params.slug}`,
    },
    openGraph: {
      title: `${title} | Itenora`,
      description,
      url: `${siteUrl}/trips/share/${params.slug}`,
      siteName: "Itenora",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Itenora`,
      description,
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

  const { data: relatedTrips } = await supabase
    .from("itineraries")
    .select("slug, title")
    .eq("destination", trip.destination)
    .neq("slug", params.slug)
    .not("slug", "is", null)
    .limit(5);

  const input = trip.generated_plan?.input ?? {};
  const itinerary = Array.isArray(trip.generated_plan?.itinerary)
    ? trip.generated_plan.itinerary
    : [];

  const destination = cleanText(trip.destination || input.destination || "");
  const title =
    cleanText(trip.title) ||
    `${typeof input.days === "number" ? `${input.days} Day ` : ""}${destination} Itinerary`;

  const days =
    typeof input.days === "number"
      ? input.days
      : itinerary.length > 0
        ? itinerary.length
        : null;

  const startDate = trip.start_date ?? input.startDate ?? undefined;
  const hasValidStartDate = isValidDateString(startDate);

  const endDate =
    trip.end_date ??
    (startDate && days ? addDays(startDate, Math.max(days, 1)) : undefined);

  const bookingLink = buildBookingAffiliateLink({
    destination,
    checkIn: startDate,
    checkOut: endDate,
  });

  const hotelLink = buildHotelAffiliateLink({
    destination,
    checkIn: startDate,
    checkOut: endDate,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://itenora.com";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TravelItinerary",
    name: title,
    description: `Travel itinerary for ${destination}`,
    url: `${siteUrl}/trips/share/${params.slug}`,
    itinerary: itinerary.map((day: any) => ({
      "@type": "ListItem",
      name: `Day ${day.day ?? ""}${day.theme ? ` - ${day.theme}` : ""}`,
      description: Array.isArray(day.stops)
        ? day.stops
            .map((stop: any) => `${stop.time ?? "Anytime"} ${stop.title ?? "Stop"}`)
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
            This itinerary for {destination || "your destination"} includes
            day-by-day suggestions, attractions, food stops, and practical
            planning ideas to make the trip easier.
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Use this itinerary as a flexible travel guide for what to do, where
            to go, and how to organise each day more smoothly.
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

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            Tip: Open maps, hotel, or activity links in a new tab so your
            itinerary stays open.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            This is especially helpful if you opened the trip from Instagram or Facebook.
          </p>
        </div>

        {destination ? (
          <section className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <h2 className="text-lg font-semibold text-orange-900">
              Stay recommendation
            </h2>
            <p className="mt-2 text-sm text-orange-800">
              Compare hotel options for this trip based on the destination
              {hasValidStartDate ? " and dates" : ""} in the itinerary.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={hotelLink}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                Find hotels in {destination}
              </a>

              <a
                href={bookingLink}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                Compare prices on Booking.com
              </a>
            </div>
          </section>
        ) : null}

        {itinerary.length > 0 ? (
          itinerary.map((day: any, index: number) => {
            const dayStops = Array.isArray(day.stops) ? day.stops : [];
            const meaningfulArea = getMeaningfulStayArea(dayStops, destination);
            const displayArea = meaningfulArea || destination;

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
            });

            const dayBookingLink = buildBookingAffiliateLink({
              destination,
              area: meaningfulArea || undefined,
              checkIn,
              checkOut,
            });

            return (
              <section
                key={day.day ?? index}
                className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Day {day.day ?? index + 1}
                      {day.theme ? ` — ${day.theme}` : ""}
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
                    <p className="text-sm font-semibold text-orange-900">
                      Stay recommendation for this day
                    </p>

                    <p className="mt-1 text-sm text-orange-800">
                      {meaningfulArea ? (
                        <>
                          Staying in{" "}
                          <span className="font-semibold">{displayArea}</span> is
                          a good fit for this day’s plan.
                        </>
                      ) : (
                        <>
                          View hotel options in{" "}
                          <span className="font-semibold">{destination}</span>.
                        </>
                      )}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={dayHotelLink}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="inline-flex rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                      >
                        {meaningfulArea
                          ? `Find hotels in ${displayArea}`
                          : `Find hotels in ${destination}`}
                      </a>

                      <a
                        href={dayBookingLink}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="inline-flex rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                      >
                        Compare prices on Booking.com
                      </a>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-4">
                  {dayStops.length > 0 ? (
                    dayStops.map((stop: any, i: number) => {
                      const mapQuery =
                        stop.mapQuery || `${stop.title || "Stop"}, ${destination}`;
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
                                  A suggested stop for this part of the itinerary.
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
                                href={buildKlookActivityLink(stop.title, destination)}
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
                              Opens in a new tab so you can keep this itinerary open.
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
              {relatedTrips.map((r: any) => (
                <li key={r.slug}>
                  <Link
                    href={`/trips/share/${r.slug}`}
                    className="text-blue-600 hover:underline"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
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