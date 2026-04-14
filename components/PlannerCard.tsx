"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const INTEREST_OPTIONS = [
  "Food",
  "Sightseeing",
  "Shopping",
  "Nature",
  "Theme parks",
  "Museums",
  "Anime",
  "Beaches",
  "Night markets",
  "Hidden gems",
  "Local experiences",
  "Family-friendly",
  "Nightlife",
  "Relaxation",
  "Instagram spots",
] as const;

type InterestOption = (typeof INTEREST_OPTIONS)[number];

const SIMPLE_INTERESTS: InterestOption[] = ["Food", "Sightseeing"];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function uniqueInterests(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function arraysEqualIgnoreOrder(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const aa = [...a].sort();
  const bb = [...b].sort();
  return aa.every((item, index) => item === bb[index]);
}

function getSuggestedInterests(args: {
  destination: string;
  people: "Solo" | "Couple" | "Friends" | "Family";
  childAges: "none" | "baby" | "toddler" | "kids" | "teens";
}): string[] {
  const { destination, people, childAges } = args;
  const text = normalizeText(destination);

  const picks: string[] = ["Food", "Sightseeing"];

  const add = (...items: InterestOption[]) => {
    picks.push(...items);
  };

  if (people === "Family") {
    add("Family-friendly");
  }

  if (childAges === "kids" || childAges === "teens") {
    add("Family-friendly");
  }

  if (people === "Couple") {
    add("Relaxation");
  }

  if (people === "Friends") {
    add("Nightlife", "Local experiences");
  }

  if (people === "Solo") {
    add("Hidden gems", "Local experiences");
  }

  if (
    text.includes("tokyo") ||
    text.includes("japan") ||
    text.includes("osaka") ||
    text.includes("kyoto") ||
    text.includes("akihabara") ||
    text.includes("shibuya")
  ) {
    add("Anime", "Food", "Shopping", "Sightseeing");
  }

  if (
    text.includes("seoul") ||
    text.includes("south korea") ||
    text.includes("korea") ||
    text.includes("busan") ||
    text.includes("myeongdong") ||
    text.includes("hongdae")
  ) {
    add("Shopping", "Food", "Nightlife", "Local experiences");
  }

  if (
    text.includes("singapore") ||
    text.includes("sentosa") ||
    text.includes("orchard")
  ) {
    add("Food", "Sightseeing", "Shopping", "Family-friendly");
  }

  if (
    text.includes("bangkok") ||
    text.includes("thailand") ||
    text.includes("phuket") ||
    text.includes("chiang mai") ||
    text.includes("krabi")
  ) {
    add("Food", "Night markets", "Local experiences");
  }

  if (
    text.includes("bali") ||
    text.includes("indonesia") ||
    text.includes("phuket") ||
    text.includes("krabi") ||
    text.includes("koh samui") ||
    text.includes("boracay") ||
    text.includes("cebu") ||
    text.includes("honolulu") ||
    text.includes("hawaii") ||
    text.includes("gold coast")
  ) {
    add("Beaches", "Relaxation", "Nature");
  }

  if (
    text.includes("sydney") ||
    text.includes("melbourne") ||
    text.includes("brisbane") ||
    text.includes("adelaide") ||
    text.includes("perth") ||
    text.includes("new york") ||
    text.includes("london") ||
    text.includes("paris") ||
    text.includes("rome") ||
    text.includes("barcelona")
  ) {
    add("Sightseeing", "Food", "Shopping");
  }

  if (
    text.includes("paris") ||
    text.includes("rome") ||
    text.includes("florence") ||
    text.includes("vienna") ||
    text.includes("athens") ||
    text.includes("london") ||
    text.includes("madrid")
  ) {
    add("Museums", "Local experiences", "Sightseeing");
  }

  if (
    text.includes("dubai") ||
    text.includes("los angeles") ||
    text.includes("new york") ||
    text.includes("miami") ||
    text.includes("las vegas")
  ) {
    add("Instagram spots", "Nightlife", "Shopping");
  }

  if (
    text.includes("queenstown") ||
    text.includes("switzerland") ||
    text.includes("interlaken") ||
    text.includes("cairns") ||
    text.includes("hobart") ||
    text.includes("new zealand")
  ) {
    add("Nature", "Hidden gems", "Local experiences");
  }

  if (
    text.includes("disney") ||
    text.includes("orlando") ||
    text.includes("anaheim") ||
    text.includes("universal")
  ) {
    add("Theme parks", "Family-friendly");
  }

  const deduped = uniqueInterests(picks).filter((item) =>
    INTEREST_OPTIONS.includes(item as InterestOption)
  );

  return deduped.slice(0, 5);
}

export default function PlannerCard() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const initialInterests = React.useMemo(() => {
    const fromQuery = searchParams.get("interests");
    if (fromQuery) {
      return fromQuery
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }

    return getSuggestedInterests({
      destination: searchParams.get("destination") || "",
      people:
        (() => {
          const p = searchParams.get("people");
          if (p === "solo") return "Solo";
          if (p === "couple") return "Couple";
          if (p === "family") return "Family";
          return "Family";
        })(),
      childAges:
        ((searchParams.get("childAges") as
          | "none"
          | "baby"
          | "toddler"
          | "kids"
          | "teens") || "none"),
    });
  }, [searchParams]);

  const [selected, setSelected] = React.useState<string[]>(initialInterests);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [usage, setUsage] = React.useState<UsageInfo | null>(null);
  const [interestMode, setInterestMode] = React.useState<"auto" | "manual">(
    searchParams.get("interests") ? "manual" : "auto"
  );

  const destinationInputRef = React.useRef(destination);
  const selectedDestinationRef = React.useRef<DestinationOption | null>(
    destinationData
  );

  React.useEffect(() => {
    destinationInputRef.current = destination;
  }, [destination]);

  React.useEffect(() => {
    selectedDestinationRef.current = destinationData;
  }, [destinationData]);

  const suggestedInterests = React.useMemo(
    () =>
      getSuggestedInterests({
        destination: destinationData?.label?.trim() || destination.trim() || "",
        people,
        childAges,
      }),
    [destination, destinationData, people, childAges]
  );

  const isDestinationResolved =
    !!destination.trim() &&
    !!destinationData &&
    normalizeText(destinationData.label) === normalizeText(destination);

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

  React.useEffect(() => {
    if (interestMode !== "auto") return;

    setSelected((prev) => {
      if (arraysEqualIgnoreOrder(prev, suggestedInterests)) {
        return prev;
      }
      return suggestedInterests;
    });
  }, [suggestedInterests, interestMode]);

  const toggleInterest = (t: string) => {
    if (loading) return;

    setInterestMode("manual");
    setSelected((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const applySuggestedInterests = () => {
    if (loading) return;
    setInterestMode("auto");
    setSelected(suggestedInterests);
  };

  const applySimpleInterests = () => {
    if (loading) return;
    setInterestMode("manual");
    setSelected(SIMPLE_INTERESTS);
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

      const finalDestinationData: DestinationOption | null =
        destinationData && destinationData.label.trim()
          ? destinationData
          : destination.trim()
            ? { label: destination.trim() }
            : null;

      if (!finalDestinationData) {
        setError("Please enter a destination");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.set("destination", finalDestinationData.label);
      params.set("days", String(safeDays));
      params.set("people", PEOPLE_MAP[people]);
      params.set("budget", BUDGET_MAP[budget]);
      params.set("pace", pace);

      if (finalDestinationData.city) {
        params.set("city", finalDestinationData.city);
      }

      if (finalDestinationData.country) {
        params.set("country", finalDestinationData.country);
      }

      if (typeof finalDestinationData.lat === "number") {
        params.set("lat", String(finalDestinationData.lat));
      }

      if (typeof finalDestinationData.lng === "number") {
        params.set("lng", String(finalDestinationData.lng));
      }

      if (startDate) params.set("startDate", startDate);
      if (arrivalTime) params.set("arrivalTime", arrivalTime);
      if (departTime) params.set("departTime", departTime);
      if (childAges) params.set("childAges", childAges);
      if (selected.length > 0) params.set("interests", selected.join(","));

      router.push(`/generate?${params.toString()}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
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
              Renews on{" "}
              {new Date(usage.currentPeriodEnd).toLocaleDateString("en-AU")}
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
                    setDestination(item.label);

                    requestAnimationFrame(() => {
                      setDestinationData(item);
                      setError("");
                    });
                  }}
                  onChangeText={(value: string) => {
                    setDestination(value);

                    const currentSelected = selectedDestinationRef.current;
                    if (
                      !currentSelected ||
                      normalizeText(value) !== normalizeText(currentSelected.label)
                    ) {
                      setDestinationData(null);
                    }
                  }}
                />
              </div>

              {!loading && destination.trim() && !isDestinationResolved && (
                <p className="mt-1 text-[11px] text-gray-400">
                  Resolving destination…
                </p>
              )}

              <p className="mt-1 text-[11px] text-gray-500">
                Choose a real city or country from the list, or type one manually.
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
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={applySuggestedInterests}
                    disabled={loading}
                    className="text-xs font-medium text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Use suggested
                  </button>
                  <button
                    type="button"
                    onClick={applySimpleInterests}
                    disabled={loading}
                    className="text-xs font-medium text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Use simple
                  </button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((t) => {
                  const on = selected.includes(t);
                  const suggested = suggestedInterests.includes(t);

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
                          : suggested
                            ? "border-orange-200 bg-orange-50 text-gray-700 hover:border-orange-300"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
                      ].join(" ")}
                      aria-pressed={on}
                      title={suggested ? "Suggested for this trip" : undefined}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>

              <p className="mt-2 text-xs text-gray-500">
                {interestMode === "auto" ? "Auto-selected" : "Selected"}:{" "}
                <span className="font-medium text-gray-700">
                  {selected.length
                    ? selected.join(", ")
                    : "None (we’ll keep it general)"}
                </span>
              </p>

              {suggestedInterests.length > 0 && (
                <p className="mt-1 text-[11px] text-gray-500">
                  Suggested for this trip:{" "}
                  <span className="font-medium text-gray-700">
                    {suggestedInterests.join(", ")}
                  </span>
                </p>
              )}
            </div>

            <div className="md:col-span-12">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Generating..." : "Plan my trip free"}
              </button>

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
  const lowerInterests = interests.map((x) => x.toLowerCase());

  const focus =
    interests.length === 0
      ? "highlights"
      : lowerInterests.some((x) => x.includes("food"))
        ? "food + local eats"
        : lowerInterests.some((x) => x.includes("sightseeing"))
          ? "iconic sights + landmarks"
          : lowerInterests.some((x) => x.includes("nature"))
            ? "nature + scenic spots"
            : lowerInterests.some((x) => x.includes("shopping"))
              ? "shopping + local areas"
              : lowerInterests.some((x) => x.includes("hidden"))
                ? "hidden gems + unique spots"
                : lowerInterests.some((x) => x.includes("instagram"))
                  ? "photo spots + viral locations"
                  : lowerInterests.some((x) => x.includes("nightlife"))
                    ? "nightlife + evening activities"
                    : lowerInterests.some((x) => x.includes("family"))
                      ? "family-friendly attractions"
                      : lowerInterests.some((x) => x.includes("anime"))
                        ? "anime spots + pop culture"
                        : lowerInterests.some((x) => x.includes("beaches"))
                          ? "beaches + relaxing stops"
                          : lowerInterests.some((x) => x.includes("museums"))
                            ? "museums + cultural highlights"
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