"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  savedTrip?: SavedTrip;
  usage?: {
    plan: string;
    used: number;
    limit: number | string;
  };
};

function gmLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function addDays(dateString: string, days: number) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const agodaCityMap: Record<string, string> = {
  tokyo: "5085",
  sydney: "14370",
  brisbane: "9466",
  bali: "17193",
  osaka: "9590",
  kyoto: "1784",
  seoul: "14690",
  adelaide: "11981",
  auckland: "3750",
  jakarta: "8691",
  singapore: "4064",
  "kuala lumpur": "14524",
  melbourne: "10372",
  bangkok: "9395", // ✅ ADD THIS
};

function getAgodaCityId(destination: string) {
  const key = destination.trim().toLowerCase();

  if (agodaCityMap[key]) return agodaCityMap[key];

  if (key === "japan") return agodaCityMap["tokyo"];
  if (key === "indonesia") return agodaCityMap["bali"];
  if (key === "australia") return agodaCityMap["sydney"];
  if (key === "south korea" || key === "korea") return agodaCityMap["seoul"];

 if (key === "thailand") return agodaCityMap["bangkok"];

  return undefined;
}

function buildAgodaLink(params: {
  destination: string;
  area?: string;
  checkIn?: string;
  checkOut?: string;
}) {
  const { destination, area, checkIn, checkOut } = params;

  const cityId = getAgodaCityId(destination);
  const query = [area, destination].filter(Boolean).join(", ");

  const url = new URL("https://www.agoda.com/en-au/search");

  // affiliate
  url.searchParams.set("cid", "1961701");

  // 🔥 KEY IMPROVEMENT
  if (area) {
    // prioritize area search
    url.searchParams.set("textToSearch", query);
  } else if (cityId) {
    url.searchParams.set("city", cityId);
  } else {
    url.searchParams.set("textToSearch", destination);
  }

  if (checkIn) url.searchParams.set("checkIn", checkIn);
  if (checkOut) url.searchParams.set("checkOut", checkOut);

  // force search behaviour (VERY IMPORTANT)
  url.searchParams.set("rooms", "1");
  url.searchParams.set("adults", "2");

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

  return `central ${destination}`;
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
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let cancelled = false;

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

        if (!cancelled) {
          setData(json);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Something went wrong.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [payload]);

  const handleOpenSavedTrip = () => {
    if (!data?.savedTrip?.slug) return;

    setRedirecting(true);
    window.location.href = `/trips/${encodeURIComponent(data.savedTrip.slug)}`;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border p-6 shadow-sm">
          <div className="text-xl font-semibold">Generating your itinerary…</div>
          <div className="mt-2 text-sm text-neutral-600">
            This usually takes ~5–10 seconds.
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
            <div className="h-32 w-full animate-pulse rounded bg-neutral-200" />
          </div>
        </div>
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

  const total = data.itinerary.reduce((sum, d) => sum + d.dailyCostEstimate, 0);
  const suggestedArea = getSuggestedStayArea(data.input.destination);
  // pick best area from itinerary (first meaningful stop)
const firstArea =
  data.itinerary?.[0]?.stops?.find((s) => s.area)?.area;

const hotelLink = buildAgodaLink({
  destination: data.input.destination,
  area: firstArea,
  checkIn: data.input.startDate,
  checkOut: data.input.startDate
    ? addDays(data.input.startDate, Math.max(data.input.days - 1, 0))
    : undefined,
});

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {data.input.days}-day {data.input.destination} ({data.input.budget})
          </h1>

          <div className="mt-1 text-sm text-neutral-600">
            Pace: {data.input.pace} • People: {data.input.people} • Est. total
            (per person): ~{total}
          </div>

          {data.usage ? (
            <div className="mt-2 text-sm text-neutral-500">
              Plan: {data.usage.plan} • Used this month: {data.usage.used} /{" "}
              {data.usage.limit}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={hotelLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 transition hover:bg-orange-100"
          >
            Check hotels
          </a>

          {data.savedTrip?.slug ? (
            <button
              className="rounded-xl border px-4 py-2 transition hover:bg-neutral-50 active:scale-95 disabled:opacity-60"
              onClick={handleOpenSavedTrip}
              disabled={redirecting}
            >
              {redirecting ? "Opening..." : "Open saved trip"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
              Stay recommendation
            </p>

            <h2 className="mt-1 text-xl font-bold text-gray-900">
              Best area to stay in {data.input.destination}
            </h2>

            <p className="mt-2 text-sm text-gray-700">
              For this trip, a practical base would be{" "}
              <span className="font-semibold">{suggestedArea}</span>. This usually
              keeps transport easier and makes the day-by-day itinerary smoother.
            </p>
          </div>

          <a
            href={hotelLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Check price on Agoda
          </a>
        </div>
      </div>

      {data.savedTrip ? (
        <div className="mt-6 rounded-2xl border p-4 text-sm text-neutral-600">
          Trip saved successfully:{" "}
          <span className="font-medium">{data.savedTrip.title}</span>
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        {data.itinerary.map((day) => (
          <div key={day.day} className="rounded-2xl border p-5 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div className="text-xl font-semibold">
                Day {day.day} {day.date ? `• ${day.date}` : ""} — {day.theme}
              </div>
              <div className="text-sm text-neutral-600">
                Daily est: ~{day.dailyCostEstimate}
              </div>
            </div>

            <div className="mt-4 divide-y">
              {day.stops.map((s, idx) => (
                <div key={idx} className="py-3">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="font-medium">
                      {s.time} — {s.title}
                      {s.area ? (
                        <span className="text-neutral-500"> • {s.area}</span>
                      ) : null}
                    </div>
                    <div className="text-sm text-neutral-600">
                      ~{s.costEstimate}
                    </div>
                  </div>

                  {s.notes ? (
                    <div className="mt-1 text-sm text-neutral-600">
                      {s.notes}
                    </div>
                  ) : null}

                  <div className="mt-2 flex flex-wrap gap-4">
                    <a
                      className="text-sm underline"
                      href={gmLink(s.mapQuery)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open on Google Maps
                    </a>

                    {idx === 0 ? (
                      <a
                        className="text-sm font-medium text-orange-700 underline"
                        href={hotelLink}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                      >
                        Check nearby hotels
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border p-5 text-sm text-neutral-600">
        Your itinerary has already been saved to your account.
      </div>
    </div>
  );
}