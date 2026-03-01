"use client";

import React from "react";

type SavedTrip = {
  id: string;
  title: string;
  destination: string;
  startDate: string | null;
  createdAt: string;
};

const KEY = "itenora:savedTrips";

export default function TripsPage() {
  const [trips, setTrips] = React.useState<SavedTrip[]>([]);

  React.useEffect(() => {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    setTrips(list);
  }, []);

  const removeTrip = (id: string) => {
    const next = trips.filter((t) => t.id !== id);
    setTrips(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Saved trips</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Saved on this device (browser). No account needed.
          </p>
        </div>
        <a className="rounded-xl border px-4 py-2 hover:bg-neutral-50" href="/">
          New trip
        </a>
      </div>

      {trips.length === 0 ? (
        <div className="mt-6 rounded-2xl border p-6 text-neutral-600">
          No saved trips yet. Generate an itinerary, then click <b>Save trip details</b>.
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {trips.map((t) => (
            <div key={t.id} className="rounded-2xl border p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-semibold">{t.title}</div>
                  <div className="mt-1 text-sm text-neutral-600">
                    Saved {new Date(t.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    className="rounded-xl border px-4 py-2 hover:bg-neutral-50"
                    href={`/trips/${encodeURIComponent(t.id)}`}
                  >
                    Open
                  </a>
                  <button
                    className="rounded-xl border px-4 py-2 hover:bg-neutral-50"
                    onClick={() => removeTrip(t.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}