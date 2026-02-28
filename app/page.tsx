"use client";

import React from "react";
import { useRouter } from "next/navigation";

const PEOPLE_MAP: Record<string, string> = {
  Solo: "solo",
  Couple: "couple",
  Friends: "couple",
  Family: "family",
};

const BUDGET_MAP: Record<string, string> = {
  Budget: "budget",
  Mid: "mid",
  Comfort: "mid",
  Luxury: "premium",
};

export default function Home() {
  const [ctaStatus, setCtaStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [ctaMsg, setCtaMsg] = React.useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          {/* Logo */}
          <a href="#" className="group flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/10 transition-transform duration-200 group-hover:scale-105">
              <img
                src="/itenora-logo.svg"
                alt="Itenora"
                className="h-full w-full object-cover"
              />
            </div>

            <span className="text-base font-semibold tracking-tight text-gray-900">
              Itenora
            </span>
          </a>

          {/* Nav */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <a className="transition-colors hover:text-gray-900" href="#how">
              How it works
            </a>
            <a className="transition-colors hover:text-gray-900" href="#features">
              Features
            </a>
            <a className="transition-colors hover:text-gray-900" href="#pricing">
              Pricing
            </a>
            <a className="transition-colors hover:text-gray-900" href="#contact">
              Contact
            </a>
          </nav>

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            <a
              href="#pricing"
              className="hidden rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition hover:text-gray-900 md:inline-flex"
            >
              View pricing
            </a>

            <a
              href="#planner"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:scale-[1.03] hover:shadow-xl"
            >
              Generate my itinerary
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-medium text-gray-700">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Early access is open
              <span className="text-gray-400">•</span>
              AI trip planning in minutes
            </div>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-6xl leading-[1.05]">
              Plan your trip{" "}
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                with AI
              </span>
              , without the stress.
            </h1>

            <p className="mt-5 max-w-xl text-lg text-gray-700">
              Pick a destination, dates, budget, and who’s going (solo, couple, or
              family). Itenora generates a day-by-day plan with smart routes,
              food picks, and cost-friendly options.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#planner"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
              >
                Get early access
              </a>

              <a
                href="#how"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                See how it works
              </a>

              <span className="text-xs text-gray-500 sm:ml-1">
                Free to start • No credit card
              </span>
            </div>

            {/* Trust cues */}
            <div className="mt-7 grid max-w-xl grid-cols-2 gap-3 text-sm text-gray-700 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3">
                <div className="font-semibold">Budget-aware</div>
                <div className="mt-1 text-xs text-gray-500">
                  Free → premium options
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3">
                <div className="font-semibold">Family-ready</div>
                <div className="mt-1 text-xs text-gray-500">Kid-friendly flow</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3">
                <div className="font-semibold">Map-friendly</div>
                <div className="mt-1 text-xs text-gray-500">Less backtracking</div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-purple-200/50 via-pink-200/30 to-orange-200/40 blur-2xl" />

            <div className="rounded-3xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500">
                    What Itenora builds
                  </p>
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                    preview
                  </span>
                </div>

                <h3 className="mt-2 text-lg font-semibold">Your trip, organised</h3>

                <p className="mt-2 text-sm text-gray-700">
                  A clean day-by-day plan with smart routes, food picks, and
                  budget-friendly options.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {["Family pace", "Budget-aware", "Map-friendly", "Food picks", "Transport tips"].map(
                    (t) => (
                      <span
                        key={t}
                        className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700"
                      >
                        {t}
                      </span>
                    )
                  )}
                </div>

                <div className="mt-5 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600">
                  Output: itinerary • costs • travel tips • edit & export
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span>Built for solo & families</span>
                  <span className="font-medium text-gray-700">~60 seconds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planner Form */}
      <section id="planner" className="mx-auto max-w-6xl px-4 pb-6 md:pb-10">
        <PlannerCard />
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
              <p className="mt-2 max-w-2xl text-gray-700">
                A simple flow that turns your preferences into a day-by-day plan you can
                actually follow.
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">60 seconds</span> to your first itinerary
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { step: "01", title: "Tell us your trip", desc: "Destination, dates, budget, who’s going, and interests." },
              { step: "02", title: "We generate a plan", desc: "A logical route with smart stops, food picks, and cost-friendly options." },
              { step: "03", title: "Customise & export", desc: "Tweak your pace, save trips, share with family, and export anytime." },
            ].map((x) => (
              <div
                key={x.step}
                className="group rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Step {x.step}</span>
                  <span className="h-9 w-9 rounded-2xl bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 ring-1 ring-black/5" />
                </div>

                <div className="mt-4 text-lg font-semibold">{x.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-gray-700">{x.desc}</div>

                <div className="mt-6 h-px w-full bg-gradient-to-r from-purple-200/60 via-pink-200/40 to-orange-200/60 opacity-0 transition group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Features</h2>
            <p className="mt-2 max-w-2xl text-gray-700">
              Built for real trips — whether you’re solo, with friends, or travelling with the kids.
            </p>
          </div>
          <div className="text-sm text-gray-600">
            Designed to be <span className="font-medium text-gray-900">mobile-first</span>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            { title: "Budget-aware suggestions", desc: "Options that match your budget — from free spots to paid attractions.", tint: "from-purple-100 via-pink-100 to-orange-100" },
            { title: "Pace controls", desc: "Relaxed, normal, or packed — itineraries that fit your energy.", tint: "from-orange-100 via-pink-100 to-purple-100" },
            { title: "Map-friendly stops", desc: "Stops grouped logically to reduce travel time between places.", tint: "from-pink-100 via-purple-100 to-orange-100" },
            { title: "Family-ready planning", desc: "Kid-friendly ideas and a sensible daily flow, so everyone enjoys the trip.", tint: "from-purple-100 via-orange-100 to-pink-100" },
          ].map((x) => (
            <div
              key={x.title}
              className="group rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${x.tint} ring-1 ring-black/5`} />
                <div>
                  <div className="text-lg font-semibold">{x.title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-gray-700">{x.desc}</div>
                </div>
              </div>

              <div className="mt-6 h-px w-full bg-gradient-to-r from-purple-200/60 via-pink-200/40 to-orange-200/60 opacity-0 transition group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Pricing</h2>
              <p className="mt-2 max-w-2xl text-gray-700">
                Start free. Upgrade when you’re planning more trips or want exports and advanced preferences.
              </p>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Cancel anytime</span> • No lock-in
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Explorer</div>
                  <div className="mt-1 text-sm text-gray-600">For trying Itenora</div>
                </div>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                  Free
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <div className="text-4xl font-semibold">$0</div>
                <div className="text-sm text-gray-500">/month</div>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-gray-700">
                <li className="flex gap-2"><span className="mt-[2px]">✓</span> 2 itineraries / month</li>
                <li className="flex gap-2"><span className="mt-[2px]">✓</span> Budget-friendly suggestions</li>
                <li className="flex gap-2"><span className="mt-[2px]">✓</span> Save 1 trip</li>
                <li className="flex gap-2"><span className="mt-[2px]">✓</span> Email support</li>
              </ul>

              <a
                href="#planner"
                className="mt-7 inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Start free
              </a>

              <p className="mt-3 text-xs text-gray-500">No credit card required.</p>
            </div>

            <div className="relative rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow">
                Most popular
              </div>

              <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-r from-purple-200/40 via-pink-200/30 to-orange-200/30 blur-xl" />

              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Plus</div>
                  <div className="mt-1 text-sm text-gray-600">For regular travel planning</div>
                </div>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                  Best value
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <div className="text-4xl font-semibold">$5</div>
                <div className="text-sm text-gray-500">/month</div>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-gray-700">
                <li className="flex gap-2"><span className="mt-[2px]">✓</span> 20 itineraries / month</li>
                <li className="flex gap-2"><span className="mt-[2px]">✓</span> Save up to 10 trips</li>
                <li className="flex gap-2"><span className="mt-[2px]">✓</span> Export + share</li>
                <li className="flex gap-2"><span className="mt-[2px]">✓</span> No watermark</li>
                <li className="flex gap-2"><span className="mt-[2px]">✓</span> Faster generation</li>
              </ul>

              <a
                href="#planner"
                className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
              >
                Upgrade to Plus
              </a>

              <p className="mt-3 text-xs text-gray-500">Great for families planning multiple days.</p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Pro</div>
                  <div className="mt-1 text-sm text-gray-600">For power users</div>
                </div>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                  Unlimited
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <div className="text-4xl font-semibold">$9</div>
                <div className="text-sm text-gray-500">/month</div>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-gray-700">
                <li className="flex gap-2"><span className="mt-[2px]">✓</span> Unlimited itineraries</li>
                <li className="flex gap-2"><span className="mt-[2px]">✓</span> Advanced preferences</li>
                <li className="flex gap-2"><span className="mt-[2px]">✓</span> Multi-city planning (coming soon)</li>
                <li className="flex gap-2"><span className="mt-[2px]">✓</span> Priority support</li>
              </ul>

              <a
                href="#planner"
                className="mt-7 inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Go Pro
              </a>

              <p className="mt-3 text-xs text-gray-500">Best for frequent travellers.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <p>
              Prices shown in <span className="font-medium text-gray-900">AUD</span>.
            </p>
            <p>
              Questions?{" "}
              <a
                href="#contact"
                className="font-medium text-gray-900 underline-offset-4 hover:underline"
              >
                Contact us
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight">Want early access?</h2>
          <p className="mt-3 text-gray-700">
            Leave your email and we’ll notify you when Itenora is ready.
          </p>

          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={async (e) => {
              e.preventDefault();

              setCtaStatus("loading");
              setCtaMsg("");

              const form = e.currentTarget;
              const emailEl = form.querySelector<HTMLInputElement>('input[type="email"]');
              const email = (emailEl?.value || "").trim();

              try {
                const res = await fetch("/api/early-access", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email, source: "cta" }),
                });

                const json = await res.json();

                if (!json.ok) {
                  setCtaStatus("error");
                  setCtaMsg(json.error || "Something went wrong");
                  return;
                }

                setCtaStatus("success");
                setCtaMsg("Thanks! You’re on the early access list.");
                form.reset();

                window.setTimeout(() => {
                  setCtaStatus("idle");
                  setCtaMsg("");
                }, 4000);
              } catch (err: any) {
                setCtaStatus("error");
                setCtaMsg(err?.message || "Network error");
              }
            }}
          >
            <input
              type="email"
              required
              placeholder="you@email.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
            />

            <button
              type="submit"
              disabled={ctaStatus === "loading"}
              className={[
                "rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform",
                ctaStatus === "loading"
                  ? "cursor-not-allowed opacity-70"
                  : "hover:scale-[1.02]",
              ].join(" ")}
            >
              {ctaStatus === "loading" ? "Submitting…" : "Notify me"}
            </button>
          </form>

          {ctaStatus !== "idle" && ctaMsg ? (
            <p
              className={[
                "mt-3 text-sm",
                ctaStatus === "success" ? "text-green-700" : "",
                ctaStatus === "error" ? "text-red-600" : "",
                ctaStatus === "loading" ? "text-gray-600" : "",
              ].join(" ")}
            >
              {ctaMsg}
            </p>
          ) : null}

          <p className="mt-3 text-xs text-gray-500">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold">Itenora</div>
              <div className="mt-1 text-sm text-gray-700">
                Questions? Email: <span className="font-medium">hello@itenora.com</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              © {new Date().getFullYear()} Itenora. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Components below Home() ---------- */

function PlannerCard() {
  const router = useRouter();

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

  const [destination, setDestination] = React.useState("Tokyo");
  const [people, setPeople] = React.useState<"Solo" | "Couple" | "Friends" | "Family">("Family");
  const [days, setDays] = React.useState<number>(3);
  const [budget, setBudget] = React.useState<"Budget" | "Mid" | "Comfort" | "Luxury">("Budget");
  const [startDate, setStartDate] = React.useState<string>("");
  const [selected, setSelected] = React.useState<string[]>(["Food", "Anime", "Shopping"]);
  const [arrivalTime, setArrivalTime] = React.useState<string>("");
  const [departTime, setDepartTime] = React.useState<string>("");
  const [childAges, setChildAges] = React.useState<"none" | "baby" | "toddler" | "kids" | "teens">("none");

  const toggleInterest = (t: string) => {
    setSelected((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const safeDays = Math.min(14, Math.max(1, Number.isFinite(days) ? days : 3));

  const plan = buildMockPlan({
    destination: destination.trim() || "Your destination",
    days: safeDays,
    people,
    budget,
    interests: selected,
  });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur md:p-8">
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[2rem] bg-gradient-to-br from-purple-200/40 via-pink-200/25 to-orange-200/30 blur-2xl" />

      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Try the planner</h2>
          <p className="mt-1 text-sm text-gray-600">
            Interactive MVP preview (no AI yet). When ready, this will generate the real itinerary.
          </p>
        </div>

        <div className="text-xs text-gray-500">
          Free to start • <span className="font-medium text-gray-700">Cancel anytime</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-12">
        {/* Form */}
<form
  className="md:col-span-7"
  onSubmit={(e) => {
    e.preventDefault();

    const pace = people === "Family" ? "relaxed" : "balanced";

    const params = new URLSearchParams();
    params.set("destination", destination.trim() || "Tokyo");
    params.set("days", String(safeDays));
    params.set("people", PEOPLE_MAP[people]);
    params.set("budget", BUDGET_MAP[budget]);
    params.set("pace", pace);

    if (startDate) params.set("startDate", startDate);

    const interestsCsv = selected.map((s) => s.trim()).filter(Boolean).join(",");
    if (interestsCsv) params.set("interests", interestsCsv);

    if (arrivalTime) params.set("arrivalTime", arrivalTime);
if (departTime) params.set("departTime", departTime);
if (childAges && childAges !== "none") params.set("childAges", childAges);

    router.push(`/itinerary?${params.toString()}`);
  }}
>
  <div className="grid gap-4 md:grid-cols-12">
    <div className="md:col-span-6">
      <label className="text-xs font-semibold text-gray-700">Destination</label>
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
      <p className="mt-1 text-[11px] text-gray-500">Max 14 days in preview.</p>
    </div>

    <div className="md:col-span-6">
      <label className="text-xs font-semibold text-gray-700">Budget style</label>
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
      <label className="text-xs font-semibold text-gray-700">Start date (optional)</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
      />
    </div>

<div className="md:col-span-6">
  <label className="text-xs font-semibold text-gray-700">Arrival time (optional)</label>
  <input
    type="time"
    value={arrivalTime}
    onChange={(e) => setArrivalTime(e.target.value)}
    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
  />
  <p className="mt-1 text-[11px] text-gray-500">If set, Day 1 starts after arrival.</p>
</div>

<div className="md:col-span-6">
  <label className="text-xs font-semibold text-gray-700">Departure time (optional)</label>
  <input
    type="time"
    value={departTime}
    onChange={(e) => setDepartTime(e.target.value)}
    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
  />
  <p className="mt-1 text-[11px] text-gray-500">If set, last day ends earlier.</p>
</div>

<div className="md:col-span-12">
  <label className="text-xs font-semibold text-gray-700">Kids age group (optional)</label>
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
        <label className="text-xs font-semibold text-gray-700">Interests</label>
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
                "rounded-full px-3 py-2 text-xs font-medium transition border",
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
          {selected.length ? selected.join(", ") : "None (we’ll keep it general)"}
        </span>
      </p>
    </div>

    <div className="md:col-span-12">
      <button
        type="submit"
        className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
      >
        Generate itinerary →
      </button>
      <p className="mt-2 text-xs text-gray-500">
        This takes you to /itinerary with your selections.
      </p>
    </div>
  </div>
</form>

        {/* Preview */}
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
                  {selected.length ? selected.slice(0, 3).join(" • ") : "General highlights"}
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
    people === "Family" ? "family pace" : budget === "Luxury" ? "comfortable" : "balanced";

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