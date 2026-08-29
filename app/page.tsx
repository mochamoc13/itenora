import { Suspense } from "react";
import Link from "next/link";
import PlannerCard from "@/components/PlannerCard";
import HeroBadges from "@/components/HeroBadges";
import SupportItenora from "@/components/SupportItenora";

const popularTrips = [
  {
    href: "/trips/share/singapore-3-day-family-budget-itinerary",
    title: "Singapore 3 Day Family Itinerary",
    description: "Budget-friendly food, attractions and easy travel routes.",
  },
  {
    href: "/trips/share/tokyo-7-day-family-itinerary",
    title: "Tokyo 7 Day Family Itinerary",
    description: "Anime spots, food picks and a practical daily flow.",
  },
  {
    href: "/trips/share/sydney-3-day-family-budget-itinerary",
    title: "Sydney 3 Day Family Itinerary",
    description: "Family-friendly city highlights with sensible pacing.",
  },
];

const features = [
  {
    title: "Budget-aware",
    description: "Suggestions that match your travel style and budget.",
  },
  {
    title: "Family-ready",
    description: "Kid-friendly ideas with a pace the whole family can enjoy.",
  },
  {
    title: "Map-friendly",
    description: "Nearby stops grouped together to reduce unnecessary travel.",
  },
  {
    title: "Easy to keep",
    description: "Save, reopen and share every itinerary from your free account.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 text-gray-900">
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Free AI trip planning
              <span className="text-emerald-400">•</span>
              No credit card
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-tight text-gray-950 md:text-6xl">
              Plan your trip with AI,
              <span className="block bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                without the stress.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-gray-700">
              Tell Itenora where you are going, your dates, budget and who is
              travelling. Get a practical day-by-day itinerary with smarter
              routes, food ideas and useful booking options in about a minute.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#planner"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-black"
              >
                Create my free itinerary
              </a>
              <a
                href="#how"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:-translate-y-0.5 hover:bg-gray-50"
              >
                See how it works
              </a>
            </div>

            <div className="mt-4">
              <HeroBadges />
            </div>

            <p className="mt-5 text-sm text-gray-600">
              Free members can create up to 10 itineraries each month. Your
              email is used to save your trips; travel-deal emails are optional.
            </p>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-purple-200/50 via-pink-200/30 to-orange-200/40 blur-2xl" />
            <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Your itinerary
                </p>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Free
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-semibold text-gray-950">
                A trip plan you can actually follow
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Itenora groups nearby attractions, considers arrival and
                departure times, and adjusts the pace for solo travellers,
                couples and families.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  "Day-by-day route",
                  "Food and activity ideas",
                  "Cost guidance",
                  "Maps and booking links",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-orange-100 text-sm font-semibold text-gray-800">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planner" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10">
        <Suspense fallback={<PlannerCardFallback />}>
          <PlannerCard />
        </Suspense>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-semibold text-gray-950">Popular itineraries</h2>
        <p className="mt-2 text-gray-700">
          Explore a ready-made trip, then create one that fits you.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {popularTrips.map((trip) => (
            <Link
              key={trip.href}
              href={trip.href}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="font-semibold text-gray-900">{trip.title}</div>
              <div className="mt-2 text-sm leading-6 text-gray-600">
                {trip.description}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-gray-200 bg-white/70">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-950">
            One minute from idea to itinerary
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ["01", "Describe your trip", "Choose the destination, dates, budget, travellers and interests."],
              ["02", "Continue with email", "A free verified account keeps your itinerary and planner details safe."],
              ["03", "Plan and book", "Open maps, compare stays and check relevant activities without losing your plan."],
            ].map(([step, title, description]) => (
              <div key={step} className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
                <span className="text-xs font-semibold text-gray-500">Step {step}</span>
                <h3 className="mt-3 text-lg font-semibold text-gray-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-5 md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-950">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Simple free access
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
            10 AI itineraries every month
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-700">
            Save and share your trips with no subscription and no credit card.
            A three-per-day safeguard keeps the service reliable for everyone.
          </p>
          <a
            href="#planner"
            className="mt-6 inline-flex rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
          >
            Start planning free
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 text-center">
        <SupportItenora />
      </section>

      <footer className="border-t border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Need help?{" "}
            <a href="mailto:support@itenora.com" className="font-medium text-gray-900 underline hover:no-underline">
              support@itenora.com
            </a>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
            <Link href="/unsubscribe" className="hover:text-gray-900">Unsubscribe</Link>
            <span>© 2026 Itenora</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PlannerCardFallback() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white/70 p-6 shadow-sm md:p-8">
      <div className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />
        <div className="h-10 w-36 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}
