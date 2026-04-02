"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import GeneratingLoader from "@/components/GeneratingLoader";
import DestinationLookup from "@/components/DestinationLookup";

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

type UsageInfo = {
  plan: "free" | "plus" | "pro";
  used: number;
  limit: number | "unlimited";
  usageLabel?: string;
  periodType?: "month" | "billing_period";
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
};

type DestinationOption = {
  label: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
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
    searchParams.get("destination") || ""
  );
  const [destinationData, setDestinationData] =
    React.useState<DestinationOption | null>(
      searchParams.get("destination")
        ? {
            label: searchParams.get("destination") || "",
            city: searchParams.get("city") || undefined,
            country: searchParams.get("country") || undefined,
            lat: searchParams.get("lat")
              ? Number(searchParams.get("lat"))
              : undefined,
            lng: searchParams.get("lng")
              ? Number(searchParams.get("lng"))
              : undefined,
          }
        : null
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
  const [usage, setUsage] = React.useState<UsageInfo | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      try {
        const res = await fetch("/api/user/plan", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!cancelled && res.ok) {
          setUsage(data);
        }
      } catch {
        console.error("Failed to load usage");
      }
    }

    loadUsage();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleInterest = (t: string) => {
    if (loading) return;

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
    if (loading) return;

    try {
      setLoading(true);
      setError("");

      if (!destinationData) {
        setError("Please select a valid destination from the list");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: destinationData.label,
          city: destinationData.city,
          country: destinationData.country,
          lat: destinationData.lat,
          lng: destinationData.lng,
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

      if (data?.usage) {
        setUsage({
          plan: data.usage.plan,
          used: data.usage.used,
          limit: data.usage.limit,
          usageLabel:
            data.usage.limit === "unlimited"
              ? `${data.usage.used} itineraries used this billing period`
              : `${data.usage.used} / ${data.usage.limit} itineraries used ${
                  data.usage.periodStart ? "this billing period" : "this month"
                }`,
          periodType: data.usage.periodStart ? "billing_period" : "month",
          currentPeriodStart: data.usage.periodStart ?? null,
          currentPeriodEnd: data.usage.periodEnd ?? null,
        });
      }

      if (!res.ok) {
   if (res.status === 429) {
  setError(
    data.error ||
      "Please wait a moment before starting another itinerary."
  );
  return;
}

        throw new Error(data.error || "Failed to generate itinerary");
      }

if (data.savedTrip?.slug) {
  router.push(`/trips/share/${data.savedTrip.slug}`);
  return;
}

      router.push("/itinerary");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const usageText =
    usage?.usageLabel ??
    (usage
      ? usage.limit === "unlimited"
        ? "Unlimited itinerary generation"
        : `${usage.used} / ${usage.limit} itineraries used ${
            usage.periodType === "billing_period"
              ? "this billing period"
              : "this month"
          }`
      : "");

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur md:p-8">
      {loading && (
        <GeneratingLoader destination={destination.trim() || "your trip"} />
      )}

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

      {usage && (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
          <div className="font-semibold capitalize">{usage.plan} plan</div>
          <div className="mt-1 text-gray-600">{usageText}</div>
          {usage.periodType === "billing_period" && usage.currentPeriodEnd ? (
            <div className="mt-1 text-xs text-gray-500">
            Renews on {new Date(usage.currentPeriodEnd).toLocaleDateString("en-AU")}
            </div>
          ) : null}
        </div>
      )}

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
              <div className="mt-2">
                <DestinationLookup
                  initialValue={destination}
                  disabled={loading}
                  onSelect={(item: DestinationOption) => {
                    setDestinationData(item);
                    setDestination(item.label);
                    setError("");
                  }}
                  onChangeText={(value: string) => {
                    setDestination(value);
                    setDestinationData(null);
                  }}
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                Choose a real city or country from the list.
              </p>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-semibold text-gray-700">People</label>
              <select
                value={people}
                onChange={(e) =>
                  setPeople(
                    e.target.value as "Solo" | "Couple" | "Friends" | "Family"
                  )
                }
                disabled={loading}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                <option>Solo</option>
                <option>Couple</option>
                <option>Friends</option>
                <option>Family</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-semibold text-gray-700">Days</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                disabled={loading}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                {[...Array(14)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} day{i + 1 > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-500">Max 14 days.</p>
            </div>

            <div className="md:col-span-6">
              <label className="text-xs font-semibold text-gray-700">
                Budget style
              </label>
              <select
                value={budget}
                onChange={(e) =>
                  setBudget(
                    e.target.value as "Budget" | "Mid" | "Comfort" | "Luxury"
                  )
                }
                disabled={loading}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50"
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
                disabled={loading}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50"
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
                disabled={loading}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50"
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
                disabled={loading}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50"
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
                onChange={(e) =>
                  setChildAges(
                    e.target.value as
                      | "none"
                      | "baby"
                      | "toddler"
                      | "kids"
                      | "teens"
                  )
                }
                disabled={loading}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50"
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
                  disabled={loading}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
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
                      disabled={loading}
                      className={[
                        "rounded-full border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
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
                  className="rounded-lg bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Generating..." : "Generate my itinerary"}
                </button>
              </SignedIn>

              {loading && (
                <p className="mt-3 text-sm text-gray-500">
                  ✈️ Finding the best spots, routes & hidden gems…
                  <br />
                  Your itinerary will be ready in under a minute.
                </p>
              )}

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-700">{error}</p>

                  {error.toLowerCase().includes("limit") && (
                    <div className="mt-3 flex gap-2">
                      <a
                        href="#pricing"
                        className="rounded-lg bg-black px-4 py-2 text-sm text-white"
                      >
                        Upgrade plan
                      </a>

                      <button
                        type="button"
                        onClick={() => setError("")}
                        className="rounded-lg border px-4 py-2 text-sm"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}

              {usage && (
                <p className="mt-2 text-xs text-gray-500">
                  {usage.usageLabel ??
                    (usage.plan === "pro"
                      ? `${usage.used} itineraries generated (unlimited)`
                      : `${usage.used} / ${usage.limit} itineraries used ${
                          usage.periodType === "billing_period"
                            ? "this billing period"
                            : "this month"
                        }`)}
                </p>
              )}
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
                    Est. spend:{" "}
                    <span className="font-medium text-gray-700">{d.spend}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-3 text-xs text-gray-600">
              Includes: transport tips • cost hints • family pacing • map-friendly
              stops
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