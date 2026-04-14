"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import GeneratingLoader from "@/components/GeneratingLoader";
import {
  buildBookingAffiliateLink,
  buildKlookActivityLink,
  isBookableActivity,
  isTopAttraction,
} from "@/lib/affiliate";

type ApiStop = {
  time: string;
  title: string;
  area?: string;
  notes?: string;
  mapQuery: string;
  costEstimate: number;
};

type ApiDay = {
  day: number;
  date?: string;
  theme: string;
  stops: ApiStop[];
  dailyCostEstimate: number;
};

type SavedTrip = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  created_at: string;
};

type ApiResponse = {
  input: {
    destination: string;
    days: number;
    people: string;
    budget: string;
    pace: string;
    startDate?: string;
    arrivalTime?: string;
    departTime?: string;
    childAges?: string;
    interests?: string[];
  };
  itinerary: ApiDay[];
  meta: {
    generatedAt: string;
    engine?: string;
    model?: string;
    mapsProvider?: string;
  };
  savedTrip?: SavedTrip | null;
  usage?: {
    plan: string;
    used: number;
    limit: number | string;
  } | null;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function gmLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function addDays(dateString: string, days: number) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return undefined;

  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildAgodaLink(params: {
  destination: string;
  area?: string;
  country?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
}) {
  const {
    destination,
    area,
    country,
    checkIn,
    checkOut,
    adults = 2,
  } = params;

  const url = new URL("/api/agoda-search", window.location.origin);

  url.searchParams.set("destination", destination);
  url.searchParams.set("adults", String(adults));

  if (area) url.searchParams.set("area", area);
  if (country) url.searchParams.set("country", country);
  if (checkIn) url.searchParams.set("checkIn", checkIn);
  if (checkOut) url.searchParams.set("checkOut", checkOut);

  return url.toString();
}

function getSuggestedStayArea(destination: string) {
  const d = destination.toLowerCase();

  if (d.includes("tokyo")) return "Shinjuku or Ueno";
  if (d.includes("osaka")) return "Namba";
  if (d.includes("kyoto")) return "Kyoto Station or Gion";
  if (d.includes("singapore")) return "Orchard, Bugis, or Marina Bay";
  if (d.includes("sydney")) return "CBD or Darling Harbour";
  if (d.includes("melbourne")) return "CBD or Southbank";
  if (d.includes("brisbane")) return "CBD or South Bank";
  if (d.includes("seoul")) return "Myeongdong or Hongdae";
  if (d.includes("bangkok")) return "Sukhumvit or Siam";
  if (d.includes("bali")) return "Seminyak, Canggu, or Ubud";
  if (d.includes("jakarta")) return "Central Jakarta or Sudirman";
  if (d.includes("auckland")) return "CBD or Viaduct Harbour";
  if (d.includes("kuala lumpur")) return "Bukit Bintang or KLCC";
  if (d.includes("gold coast")) return "Surfers Paradise or Main Beach";
  if (d.includes("hamburg")) return "Hohenfelde";

  return `central ${destination}`;
}

function getCountryFromDestination(destination: string) {
  const parts = destination
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return parts[parts.length - 1];
  }

  const d = destination.toLowerCase();

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
  if (d.includes("bali") || d.includes("jakarta")) return "Indonesia";
  if (d.includes("auckland")) return "New Zealand";
  if (d.includes("kuala lumpur")) return "Malaysia";
  if (d.includes("hong kong")) return "Hong Kong";
  if (d.includes("hamburg")) return "Germany";

  return undefined;
}

function buildOverviewBullets(itinerary: ApiDay[], destination: string) {
  return itinerary.map((day, index) => {
    const stops = Array.isArray(day?.stops) ? day.stops : [];

    const stopTitles = stops
      .slice(0, 2)
      .map((stop) => cleanText(stop?.title))
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
}

function buildIntroParagraph(data: ApiResponse) {
  const destination = data.input.destination || "your destination";
  const people = data.input.people || "travellers";

  if (people === "family") {
    return `Discover the vibrant city of ${destination} with this ${data.input.days}-day itinerary perfect for families. Explore culinary delights, natural beauty, and memorable attractions with a plan designed for both adults and children.`;
  }

  if (people === "couple") {
    return `Discover ${destination} with this ${data.input.days}-day itinerary designed for couples. Enjoy a balanced mix of attractions, food spots, and memorable moments planned for a smoother trip.`;
  }

  if (people === "solo") {
    return `Explore ${destination} with this ${data.input.days}-day itinerary built for solo travellers. Enjoy a smart mix of attractions, food stops, and practical planning suggestions.`;
  }

  return `Explore ${destination} with this ${data.input.days}-day itinerary featuring attractions, food spots, and practical day-by-day planning ideas.`;
}

export default function ItineraryClient() {
  const sp = useSearchParams();

  const payload = useMemo(() => {
    const interests = (sp.get("interests") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      destination: sp.get("destination") ?? "Tokyo",
      days: Number(sp.get("days") ?? 3),
      people: sp.get("people") ?? "family",
      budget: sp.get("budget") ?? "mid",
      pace: sp.get("pace") ?? "balanced",
      startDate: sp.get("startDate") || undefined,
      arrivalTime: sp.get("arrivalTime") || undefined,
      departTime: sp.get("departTime") || undefined,
      childAges: sp.get("childAges") ?? "none",
      interests,
    };
  }, [sp]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasStartedRef = useRef(false);

useEffect(() => {
  if (hasStartedRef.current) return;
  hasStartedRef.current = true;

  async function run() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to generate itinerary");
      }

      setData(json);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  run();
}, [payload]);

if (loading && !data) {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <GeneratingLoader destination={payload.destination} />
    </div>
  );
}

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border p-6">
          <div className="text-xl font-semibold">Couldn’t generate itinerary</div>
          <div className="mt-2 text-sm text-neutral-600">
            {error ?? "Unknown error"}
          </div>
          <a href="/" className="mt-4 inline-block rounded-xl border px-4 py-2">
            Back to planner
          </a>
        </div>
      </div>
    );
  }

  const isGuest = !data.savedTrip;
  const suggestedArea = getSuggestedStayArea(data.input.destination);
  const country = getCountryFromDestination(data.input.destination);
  const overviewBullets = buildOverviewBullets(
    data.itinerary,
    data.input.destination
  );

  const adults =
    data.input.people === "solo" ? 1 : data.input.people === "couple" ? 2 : 2;

  const overallAgodaLink = buildAgodaLink({
    destination: data.input.destination,
    area: suggestedArea,
    country,
    checkIn: data.input.startDate,
    checkOut: data.input.startDate
      ? addDays(data.input.startDate, Math.max(data.input.days, 1))
      : undefined,
    adults,
  });

  const overallTripLink = buildBookingAffiliateLink({
    destination: data.input.destination,
    area: suggestedArea,
    checkIn: data.input.startDate,
    checkOut: data.input.startDate
      ? addDays(data.input.startDate, Math.max(data.input.days, 1))
      : undefined,
  });

  const totalDays = data.itinerary.length;
  const visibleDays = isGuest ? Math.max(1, Math.ceil(totalDays / 2)) : totalDays;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <article className="space-y-8">
        <header className="rounded-3xl border border-black/10 bg-gradient-to-br from-purple-50 via-white to-orange-50 p-6 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {data.savedTrip?.title ||
              `${data.input.days} Day ${data.input.destination} Itinerary`}
          </h1>

          <p className="mt-3 text-base leading-7 text-gray-700">
            {buildIntroParagraph(data)}
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Updated for 2026 travel. Use this itinerary as a flexible travel
            guide for what to do, where to go, and how to organise each day
            more smoothly.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
              {data.input.days} day{data.input.days > 1 ? "s" : ""}
            </span>

            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
              {data.input.budget}
            </span>

            {data.input.startDate ? (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                Hotel-ready
              </span>
            ) : null}
          </div>
        </header>

        {overviewBullets.length > 0 ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              {data.input.destination} itinerary overview
            </h2>

            <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-700">
              {overviewBullets.map((item, index) => (
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

        <section className="rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-2xl flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-900">
                Recommended area
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {suggestedArea}
              </h2>

              <p className="mt-2 text-sm leading-6 text-orange-900/85">
                {suggestedArea} is a practical base for this itinerary with
                easier access to nearby stops.
              </p>

              <p className="mt-2 text-xs text-gray-600">
                Use the main hotel button for the best match. Agoda is available
                as a backup option.
              </p>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[320px]">
              <a
                href={overallTripLink}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Find hotels in {suggestedArea}
              </a>

              <a
                href={overallAgodaLink}
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

        {data.savedTrip ? (
          <div className="rounded-2xl border p-4 text-sm text-neutral-600">
            Trip saved successfully:{" "}
            <span className="font-medium">{data.savedTrip.title}</span>
          </div>
        ) : null}

        {isGuest ? (
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
            You are viewing a free preview. Sign up free to unlock the full
            itinerary, save your trip, and edit it later.
          </div>
        ) : null}

        <div className="space-y-6">
          {data.itinerary.map((day, index) => {
            const isLocked = isGuest && index >= visibleDays;

            const dayArea =
              day.stops.find((stop) => cleanText(stop.area))?.area || suggestedArea;

            const dayTripLink = buildBookingAffiliateLink({
              destination: data.input.destination,
              area: dayArea,
              checkIn: day.date,
              checkOut: day.date ? addDays(day.date, 1) : undefined,
            });

            const dayAgodaLink = buildAgodaLink({
              destination: data.input.destination,
              area: dayArea,
              country,
              checkIn: day.date,
              checkOut: day.date ? addDays(day.date, 1) : undefined,
              adults,
            });

            return (
              <section
                key={day.day}
                className={`rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition ${
                  isLocked ? "pointer-events-none opacity-60 blur-[2px]" : ""
                }`}
              >
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Day {day.day} — {day.theme}
                    </h2>
                    {day.date ? (
                      <p className="mt-1 text-sm text-gray-500">{day.date}</p>
                    ) : null}
                  </div>

                  <div className="text-sm text-gray-500">
                    Daily est. total: ~{day.dailyCostEstimate}
                  </div>
                </div>

                <div className="mb-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 max-w-2xl flex-1">
                      <p className="text-sm font-semibold text-orange-900">
                        Recommended area: {dayArea}
                      </p>

                      <p className="mt-1 text-sm text-orange-800">
                        {dayArea} is a practical base for this itinerary with
                        easier access to nearby stops.
                      </p>

                      <p className="mt-1 text-xs text-gray-600">
                        Search hotels in {dayArea}
                        {day.date ? ` from ${day.date} to ${addDays(day.date, 1)}` : ""}
                        .
                      </p>
                    </div>

                    <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[280px]">
                      <a
                        href={dayTripLink}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
                      >
                        Find hotels in {dayArea}
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

                <div className="space-y-4">
                  {day.stops.map((stop, idx) => (
                    <div
                      key={idx}
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
                          ) : null}
                        </div>

                        <div className="text-sm text-gray-500">
                          ~{stop.costEstimate ?? 0}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <a
                          href={gmLink(
                            stop.mapQuery ||
                              `${stop.title || "Stop"}, ${data.input.destination}`
                          )}
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
                              data.input.destination
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
                          Opens in a new tab so you can keep this itinerary open.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {isGuest ? (
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-6 text-center">
            <div className="text-lg font-semibold text-gray-900">
              🔒 Unlock your full itinerary
            </div>

            <div className="mt-2 text-sm text-gray-600">
              Sign up free to see all days, save your trip, edit it later, and
              come back anytime.
            </div>

            <div className="mt-3 text-sm text-gray-600">
              ✨ Full day-by-day plan • 📍 Map links • 💾 Save to My Trips
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <a
                href="/sign-up"
                className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white"
              >
                Sign up free
              </a>

              <a
                href="/sign-in"
                className="rounded-xl border px-6 py-3 text-sm font-medium"
              >
                Sign in
              </a>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border p-5 text-sm text-neutral-600">
            Your itinerary has already been saved to your account.
          </div>
        )}
      </article>
    </div>
  );
}