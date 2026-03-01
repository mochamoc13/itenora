"use client";
export const dynamic = "force-dynamic";

import React from "react";

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
  meta?: any;
};

type SavedTrip = {
  id: string;
  title: string;
  destination: string;
  startDate: string | null;
  createdAt: string;
  data: ApiResponse;
};

const KEY = "itenora:savedTrips";

function gmLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function TripDetailPage({ params }: { params: { id: string } }) {
  const [trip, setTrip] = React.useState<SavedTrip | null>(null);

  React.useEffect(() => {
    const raw = localStorage.getItem(KEY);
    const list: SavedTrip[] = raw ? JSON.parse(raw) : [];
    const found = list.find((t) => t.id === params.id) || null;
    setTrip(found);
  }, [params.id]);

  if (!trip) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border p-6">
          <div className="text-xl font-semibold">Trip not found</div>
          <p className="mt-2 text-sm text-neutral-600">
            This trip may have been deleted or saved on another device/browser.
          </p>
          <div className="mt-4 flex gap-2">
            <a className="rounded-xl border px-4 py-2 hover:bg-neutral-50" href="/trips">
              Back to saved trips
            </a>
            <a className="rounded-xl border px-4 py-2 hover:bg-neutral-50" href="/">
              New trip
            </a>
          </div>
        </div>
      </div>
    );
  }

  const data = trip.data;
  const total = data.itinerary.reduce((sum, d) => sum + (Number(d.dailyCostEstimate) || 0), 0);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {data.input.days}-day {data.input.destination} ({data.input.budget})
          </h1>
          <div className="mt-1 text-sm text-neutral-600">
            Pace: {data.input.pace} • People: {data.input.people} • Est. total (per person): ~{total}
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            Saved {new Date(trip.createdAt).toLocaleString()}
          </div>
        </div>

        <div className="flex gap-2">
          <a className="rounded-xl border px-4 py-2 hover:bg-neutral-50" href="/trips">
            Saved trips
          </a>
          <a className="rounded-xl border px-4 py-2 hover:bg-neutral-50" href="/">
            New trip
          </a>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {data.itinerary.map((day) => (
          <div key={day.day} className="rounded-2xl border p-5 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div className="text-xl font-semibold">
                Day {day.day} {day.date ? `• ${day.date}` : ""} — {day.theme}
              </div>
              <div className="text-sm text-neutral-600">Daily est: ~{day.dailyCostEstimate}</div>
            </div>

            <div className="mt-4 divide-y">
              {day.stops.map((s, idx) => (
                <div key={idx} className="py-3">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="font-medium">
                      {s.time} — {s.title}
                      {s.area ? <span className="text-neutral-500"> • {s.area}</span> : null}
                    </div>
                    <div className="text-sm text-neutral-600">~{s.costEstimate}</div>
                  </div>

                  {s.notes ? <div className="mt-1 text-sm text-neutral-600">{s.notes}</div> : null}

                  <div className="mt-2">
                    <a className="text-sm underline" href={gmLink(s.mapQuery)} target="_blank" rel="noreferrer">
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
        MVP note: Saved locally in your browser. For cross-device saving, we’ll add accounts later.
      </div>
    </div>
  );
}