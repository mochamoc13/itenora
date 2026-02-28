// app/itinerary/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
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

type ApiResponse = {
  input: any;
  itinerary: ApiDay[];
  meta: { generatedAt: string; mapsProvider: string };
};

function gmLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
}

export default function ItineraryPage() {
  const sp = useSearchParams();

const payload = useMemo(() => {
  const interests = (sp.get("interests") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    destination: sp.get("destination") ?? "Tokyo",
    days: Number(sp.get("days") ?? 3),
    people: (sp.get("people") ?? "family") as any,
    budget: (sp.get("budget") ?? "mid") as any,
    pace: (sp.get("pace") ?? "balanced") as any,

    startDate: sp.get("startDate") || undefined,

    // ✅ MUST match backend keys exactly
    arrivalTime: sp.get("arrivalTime") || undefined,
    departTime: sp.get("departTime") || undefined,
    childAges: (sp.get("childAges") ?? "none") as any,

    interests,
  };
}, [sp]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  let cancelled = false;

  async function run() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await res.text(); // read raw first
      console.log("RAW /api/generate:", raw.slice(0, 200));

      let json: any;
      try {
        json = JSON.parse(raw);
      } catch {
        throw new Error(
          "Server returned HTML (not JSON). First 200 chars: " + raw.slice(0, 200)
        );
      }

      if (!res.ok) throw new Error(json?.error || "Failed to generate.");

      if (!cancelled) setData(json);
    } catch (e: any) {
      if (!cancelled) setError(e?.message || "Something went wrong.");
    } finally {
      if (!cancelled) setLoading(false);
    }
  }

  run();
  return () => {
    cancelled = true;
  };
}, [payload]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border p-6 shadow-sm">
          <div className="text-xl font-semibold">Generating your itinerary…</div>
          <div className="mt-2 text-sm text-neutral-600">
            This usually takes ~5–10 seconds for MVP.
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

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {data.input.days}-day {data.input.destination} ({data.input.budget})
          </h1>
          <div className="mt-1 text-sm text-neutral-600">
            Pace: {data.input.pace} • People: {data.input.people} • Est. total
            (per person): ~{total}
          </div>
        </div>

        <button
          className="rounded-xl border px-4 py-2"
          onClick={() =>
            navigator.clipboard.writeText(JSON.stringify(data, null, 2))
          }
        >
          Copy JSON
        </button>
      </div>

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
                    <div className="mt-1 text-sm text-neutral-600">{s.notes}</div>
                  ) : null}

                  <div className="mt-2">
                    <a
                      className="text-sm underline"
                      href={gmLink(s.mapQuery)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open on Google Maps
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border p-5 text-sm text-neutral-600">
        MVP note: These are rule-based suggestions. Next step is swapping the
        generator for real AI + better place picking.
      </div>
    </div>
  );
}