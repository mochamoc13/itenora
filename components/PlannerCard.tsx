"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

const PEOPLE_MAP: Record<string, "solo" | "couple" | "family"> = {
  Solo: "solo",
  Couple: "couple",
  Friends: "couple",
  Family: "family",
};

const BUDGET_MAP: Record<string, "budget" | "mid" | "premium"> = {
  Budget: "budget",
  Mid: "mid",
  Comfort: "mid",
  Luxury: "premium",
};

export default function PlannerCard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const interestOptions = [
    "Food",
    "Nature",
    "Shopping",
    "Theme parks",
    "Museums",
    "Anime",
    "Beaches",
    "Night markets",
  ] as const;

  const [destination, setDestination] = React.useState(
    searchParams.get("destination") || "Tokyo"
  );

  const [people, setPeople] = React.useState<
    "Solo" | "Couple" | "Friends" | "Family"
  >(() => {
    const p = searchParams.get("people");
    if (p === "solo") return "Solo";
    if (p === "couple") return "Couple";
    if (p === "family") return "Family";
    return "Family";
  });

  const [days, setDays] = React.useState<number>(
    Number(searchParams.get("days") || 3)
  );

  const [budget, setBudget] = React.useState<
    "Budget" | "Mid" | "Comfort" | "Luxury"
  >(() => {
    const b = searchParams.get("budget");
    if (b === "budget") return "Budget";
    if (b === "mid") return "Mid";
    if (b === "premium") return "Luxury";
    return "Budget";
  });

  const [startDate, setStartDate] = React.useState<string>(
    searchParams.get("startDate") || ""
  );

  const [selected, setSelected] = React.useState<string[]>(
    searchParams.get("interests")
      ? searchParams
          .get("interests")!
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      : ["Food", "Anime", "Shopping"]
  );

  const [arrivalTime, setArrivalTime] = React.useState<string>(
    searchParams.get("arrivalTime") || ""
  );

  const [departTime, setDepartTime] = React.useState<string>(
    searchParams.get("departTime") || ""
  );

  const [childAges, setChildAges] = React.useState<
    "none" | "baby" | "toddler" | "kids" | "teens"
  >(
    ((searchParams.get("childAges") as
      | "none"
      | "baby"
      | "toddler"
      | "kids"
      | "teens") || "none")
  );

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const toggleInterest = (t: string) => {
    setSelected((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const safeDays = Math.min(14, Math.max(1, Number.isFinite(days) ? days : 3));
  const pace: "relaxed" | "balanced" =
    people === "Family" ? "relaxed" : "balanced";

  const plan = buildMockPlan({
    destination: destination.trim() || "Your destination",
    days: safeDays,
    people,
    budget,
    interests: selected,
  });

  async function handleGenerate() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: destination.trim() || "Tokyo",
          days: safeDays,
          people: PEOPLE_MAP[people],
          budget: BUDGET_MAP[budget],
          pace,
          startDate: startDate || undefined,
          arrivalTime: arrivalTime || undefined,
          departTime: departTime || undefined,
          childAges,
          interests: selected.map((s) => s.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate itinerary");
      }

      if (data.savedTrip?.id) {
        router.push(`/trips/${data.savedTrip.id}`);
        return;
      }

      router.push("/itinerary");
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur md:p-8">
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[2rem] bg-gradient-to-br from-purple-200/40 via-pink-200/25 to-orange-200/30 blur-2xl" />

      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Try the planner</h2>
          <p className="mt-1 text-sm text-gray-600">
            Interactive planner with live preview. Generate a real AI itinerary
            when ready.
          </p>
        </div>

        <div className="text-xs text-gray-500">
          Free to start •{" "}
          <span className="font-medium text-gray-700">Cancel anytime</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-12">
        <form
          className="md:col-span-7"
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
        >
          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-6">
              <label className="text-xs font-semibold text-gray-700">
                Destination
              </label>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Tokyo, Singapore, Bali..."
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-semibold text-gray-700">People</label>
              <select
                value={people}
                onChange={(e) => setPeople(e.target.value as any)}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
              >
                <option>Solo</option>
                <option>Couple</option>
                <option>Friends</option>
                <option>Family</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-semibold text-gray-700">Days</label>
              <input
                type="number"
                min={1}
                max={14}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value || "3", 10))}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
              <p className="mt-1 text-[11px] text-gray-500">Max 14 days.</p>
            </div>

            <div className="md:col-span-6">
              <label className="text-xs font-semibold text-gray-700">
                Budget style
              </label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value as any)}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
              >
                <option>Budget</option>
                <option>Mid</option>
                <option>Comfort</option>
                <option>Luxury</option>
              </select>
            </div>

            <div className="md:col-span-6">
              <label className="text-xs font-semibold text-gray-700">
                Start date (optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div className="md:col-span-6">
              <label className="text-xs font-semibold text-gray-700">
                Arrival time (optional)
              </label>
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                If set, Day 1 starts after arrival.
              </p>
            </div>

            <div className="md:col-span-6">
              <label className="text-xs font-semibold text-gray-700">
                Departure time (optional)
              </label>
              <input
                type="time"
                value={departTime}
                onChange={(e) => setDepartTime(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                If set, last day ends earlier.
              </p>
            </div>

            <div className="md:col-span-12">
              <label className="text-xs font-semibold text-gray-700">
                Kids age group (optional)
              </label>
              <select
                value={childAges}
                onChange={(e) => setChildAges(e.target.value as any)}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
              >
                <option value="none">No kids / not specified</option>
                <option value="baby">Baby (0–1)</option>
                <option value="toddler">Toddler (1–3)</option>
                <option value="kids">Young kids (4–10)</option>
                <option value="teens">Teens (11–17)</option>
              </select>
            </div>

            <div className="md:col-span-12">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">
                  Interests
                </label>
                <button
                  type="button"
                  onClick={() => setSelected(["Food", "Nature"])}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  Use simple
                </button>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {interestOptions.map((t) => {
                  const on = selected.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleInterest(t)}
                      className={[
                        "rounded-full border px-3 py-2 text-xs font-medium transition",
                        on
                          ? "border-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
                      ].join(" ")}
                      aria-pressed={on}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Selected:{" "}
                <span className="font-medium text-gray-700">
                  {selected.length
                    ? selected.join(", ")
                    : "None (we’ll keep it general)"}
                </span>
              </p>
            </div>

            <div className="md:col-span-12">
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/#planner">
                  <button
                    type="button"
                    className="rounded-lg bg-black px-6 py-3 text-white"
                  >
                    Sign in to generate
                  </button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-black px-6 py-3 text-white disabled:opacity-60"
                >
                  {loading ? "Generating..." : "Generate my itinerary"}
                </button>
              </SignedIn>

              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

              <p className="mt-2 text-xs text-gray-500">
                This will generate and save your itinerary.
              </p>
            </div>
          </div>
        </form>

        <div className="md:col-span-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500">Live preview</p>
                <h3 className="mt-1 text-lg font-semibold">
                  {safeDays}-day {destination.trim() ? destination.trim() : "Trip"}{" "}
                  <span className="text-sm font-medium text-gray-500">
                    ({budget.toLowerCase()})
                  </span>
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {people} •{" "}
                  {selected.length
                    ? selected.slice(0, 3).join(" • ")
                    : "General highlights"}
                  {selected.length > 3 ? " • ..." : ""}
                  {startDate ? ` • starts ${startDate}` : ""}
                </p>
              </div>

              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                preview
              </span>
            </div>

            <div className="mt-4 space-y-3 text-sm text-gray-700">
              {plan.map((d) => (
                <div key={d.day} className="rounded-2xl bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">Day {d.day}</div>
                    <span className="text-xs text-gray-500">{d.pace}</span>
                  </div>
                  <div className="mt-1 text-gray-700">{d.summary}</div>
                  <div className="mt-2 text-xs text-gray-500">
                    Est. spend: <span className="font-medium text-gray-700">{d.spend}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-3 text-xs text-gray-600">
              Includes: transport tips • cost hints • family pacing • map-friendly stops
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildMockPlan({
  destination,
  days,
  people,
  budget,
  interests,
}: {
  destination: string;
  days: number;
  people: string;
  budget: string;
  interests: string[];
}) {
  const focus =
    interests.length === 0
      ? "highlights"
      : interests.some((x) => x.toLowerCase().includes("food"))
      ? "food + local spots"
      : interests.some((x) => x.toLowerCase().includes("nature"))
      ? "nature + scenic stops"
      : "top experiences";

  const pace =
    people === "Family"
      ? "family pace"
      : budget === "Luxury"
      ? "comfortable"
      : "balanced";

  const spend = (() => {
    if (budget === "Budget") return "Low";
    if (budget === "Mid") return "Medium";
    if (budget === "Comfort") return "Med–High";
    return "High";
  })();

  const templates = [
    `Easy start in ${destination} • neighbourhood walk • ${focus}`,
    `Iconic sights • short travel hops • photo stops`,
    `Local market • museum/attraction • sunset viewpoint`,
    `Day trip option • nature spot • relaxed dinner`,
    `Shopping street • snacks • evening lights`,
    `Hidden gems • café break • flexible time`,
    `Culture morning • park time • local eats`,
    `Theme/experience day • family-friendly flow`,
    `Waterfront • comfort pace • nice dinner`,
    `Wrap-up favourites • souvenirs • simple finish`,
  ];

  return Array.from({ length: days }).map((_, i) => ({
    day: i + 1,
    pace,
    summary: templates[i % templates.length],
    spend,
  }));
}