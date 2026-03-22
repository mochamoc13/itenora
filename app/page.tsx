import { Suspense } from "react";
import PlannerCard from "@/components/PlannerCard";
import PricingButton from "@/components/PricingButtons";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 text-gray-900">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-medium text-gray-700">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Early access is open
              <span className="text-gray-400">•</span>
              AI trip planning in minutes
            </div>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Plan your trip{" "}
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                with AI
              </span>
              , without the stress.
            </h1>

            <p className="mt-5 max-w-xl text-lg text-gray-700">
              Pick a destination, dates, budget, and who’s going. Itenora
              generates a day-by-day plan with smart routes, food picks, and
              cost-friendly options.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#planner"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
              >
                Start planning
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

            <div className="mt-7 grid max-w-xl grid-cols-2 gap-3 text-sm text-gray-700 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3">
                <div className="font-semibold">Budget-aware</div>
                <div className="mt-1 text-xs text-gray-500">
                  Free → premium options
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3">
                <div className="font-semibold">Family-ready</div>
                <div className="mt-1 text-xs text-gray-500">
                  Kid-friendly flow
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3">
                <div className="font-semibold">Map-friendly</div>
                <div className="mt-1 text-xs text-gray-500">
                  Less backtracking
                </div>
              </div>
            </div>
          </div>

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

                <h3 className="mt-2 text-lg font-semibold">
                  Your trip, organised
                </h3>

                <p className="mt-2 text-sm text-gray-700">
                  A clean day-by-day plan with smart routes, food picks, and
                  budget-friendly options.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Family pace",
                    "Budget-aware",
                    "Map-friendly",
                    "Food picks",
                    "Transport tips",
                  ].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700"
                    >
                      {t}
                    </span>
                  ))}
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

      <section id="planner" className="mx-auto max-w-6xl px-4 pb-6 md:pb-10">
        <Suspense fallback={<PlannerCardFallback />}>
          <PlannerCard />
        </Suspense>
      </section>

      <section id="how" className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                How it works
              </h2>
              <p className="mt-2 max-w-2xl text-gray-700">
                A simple flow that turns your preferences into a day-by-day plan
                you can actually follow.
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">60 seconds</span> to
              your first itinerary
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Tell us your trip",
                desc: "Destination, dates, budget, who’s going, and interests.",
              },
              {
                step: "02",
                title: "We generate a plan",
                desc: "A logical route with smart stops, food picks, and cost-friendly options.",
              },
              {
                step: "03",
                title: "Customise & export",
                desc: "Tweak your pace, save trips, share with family, and export anytime.",
              },
            ].map((x) => (
              <div
                key={x.step}
                className="group rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">
                    Step {x.step}
                  </span>
                  <span className="h-9 w-9 rounded-2xl bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 ring-1 ring-black/5" />
                </div>

                <div className="mt-4 text-lg font-semibold">{x.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-gray-700">
                  {x.desc}
                </div>

                <div className="mt-6 h-px w-full bg-gradient-to-r from-purple-200/60 via-pink-200/40 to-orange-200/60 opacity-0 transition group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Features</h2>
            <p className="mt-2 max-w-2xl text-gray-700">
              Built for real trips — whether you’re solo, with friends, or
              travelling with the kids.
            </p>
          </div>
          <div className="text-sm text-gray-600">
            Designed to be{" "}
            <span className="font-medium text-gray-900">mobile-first</span>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            {
              title: "Budget-aware suggestions",
              desc: "Options that match your budget — from free spots to paid attractions.",
              tint: "from-purple-100 via-pink-100 to-orange-100",
            },
            {
              title: "Pace controls",
              desc: "Relaxed, normal, or packed — itineraries that fit your energy.",
              tint: "from-orange-100 via-pink-100 to-purple-100",
            },
            {
              title: "Map-friendly stops",
              desc: "Stops grouped logically to reduce travel time between places.",
              tint: "from-pink-100 via-purple-100 to-orange-100",
            },
            {
              title: "Family-ready planning",
              desc: "Kid-friendly ideas and a sensible daily flow, so everyone enjoys the trip.",
              tint: "from-purple-100 via-orange-100 to-pink-100",
            },
          ].map((x) => (
            <div
              key={x.title}
              className="group rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${x.tint} ring-1 ring-black/5`}
                />
                <div>
                  <div className="text-lg font-semibold">{x.title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-gray-700">
                    {x.desc}
                  </div>
                </div>
              </div>

              <div className="mt-6 h-px w-full bg-gradient-to-r from-purple-200/60 via-pink-200/40 to-orange-200/60 opacity-0 transition group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Pricing</h2>
              <p className="mt-2 max-w-2xl text-gray-700">
                Start free. Upgrade when you’re planning more trips or want
                exports and advanced preferences.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Try risk-free • Cancel anytime • No lock-in
            </div>
          </div>

          <div className="mt-4">
            <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Early access offer: Free plan temporarily includes 4 itineraries
              instead of 2
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="relative rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="absolute -top-3 left-6 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow">
                EARLY ACCESS
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Explorer</div>
                  <div className="mt-1 text-sm text-gray-600">
                    For trying Itenora
                  </div>
                </div>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                  Free
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <div className="text-4xl font-semibold">$0</div>
                <div className="text-sm text-gray-500">/month</div>
              </div>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-xs font-semibold text-amber-700">
                  🎉 EARLY ACCESS BONUS
                </div>
                <div className="mt-2 text-sm text-gray-500 line-through">
                  Normally 2 itineraries / month
                </div>
                <div className="mt-1 text-xl font-bold text-amber-700">
                  4 itineraries / month
                </div>
                <div className="mt-1 text-xs text-amber-700">
                  Free upgrade for a limited time
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span>✓</span> Budget-friendly suggestions
                </li>
                <li className="flex gap-2">
                  <span>✓</span> Save 1 trip
                </li>
                <li className="flex gap-2">
                  <span>✓</span> Email support
                </li>
              </ul>

              <a
                href="#planner"
                className="mt-7 inline-flex w-full items-center justify-center rounded-xl border border-amber-300 bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                Start free (4 trips)
              </a>

              <p className="mt-3 text-xs text-gray-500">
                No credit card required.
              </p>
            </div>

            <div className="relative rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow">
                Most popular
              </div>

              <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-r from-purple-200/40 via-pink-200/30 to-orange-200/30 blur-xl" />

              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Plus</div>
                  <div className="mt-1 text-sm text-gray-600">
                    For regular travel planning
                  </div>
                </div>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                  Best value
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <div className="text-4xl font-semibold">$5</div>
                <div className="text-sm text-gray-500">/month</div>
              </div>

              <p className="mt-2 text-xs font-medium text-emerald-600">
                ✔ Cancel anytime • No lock-in
              </p>

              <ul className="mt-6 space-y-3 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span>✓</span> 20 itineraries / month
                </li>
                <li className="flex gap-2">
                  <span>✓</span> Save up to 10 trips
                </li>
                <li className="flex gap-2">
                  <span>✓</span> Export + share
                </li>
                <li className="flex gap-2">
                  <span>✓</span> No watermark
                </li>
                <li className="flex gap-2">
                  <span>✓</span> Faster generation
                </li>
              </ul>

              <div className="mt-4 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
                Good for occasional and family trip planning
              </div>

              <PricingButton
                plan="plus"
                className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-60"
              >
                Upgrade to Plus
              </PricingButton>

              <p className="mt-3 text-xs text-gray-500">
                Great for families planning multiple days.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Pro</div>
                  <div className="mt-1 text-sm text-gray-600">
                    For frequent travellers
                  </div>
                </div>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                  Premium
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <div className="text-4xl font-semibold">$9</div>
                <div className="text-sm text-gray-500">/month</div>
              </div>

              <p className="mt-2 text-xs font-medium text-emerald-600">
                ✔ Cancel anytime • No lock-in
              </p>

              <ul className="mt-6 space-y-3 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span>✓</span> Unlimited itineraries*
                </li>
                <li className="flex gap-2">
                  <span>✓</span> Advanced itinerary editing
                </li>
                <li className="flex gap-2">
                  <span>✓</span> Smart travel preferences
                </li>
                <li className="flex gap-2">
                  <span>✓</span> Regenerate specific days (Coming soon)
                </li>
                <li className="flex gap-2">
                  <span>✓</span> Priority processing
                </li>
              </ul>

              <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50 p-4">
                <div className="text-xs font-semibold text-purple-700">
                  BEST FOR FREQUENT TRAVELLERS
                </div>
                <div className="mt-2 text-sm text-purple-800">
                  More control, smarter planning, and faster trip building.
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-500">*Fair usage applies</p>

              <PricingButton
                plan="pro"
                className="mt-7 inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
              >
                Go Pro
              </PricingButton>

              <p className="mt-3 text-xs text-gray-500">
                Best for frequent travellers and repeat planning.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <p>
              Prices shown in{" "}
              <span className="font-medium text-gray-900">AUD</span>.
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

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight">
            Start planning your next trip today
          </h2>
          <p className="mt-3 text-gray-700">
            It takes less than 60 seconds to generate your first itinerary.
          </p>

          <a
            href="#planner"
            className="mt-6 inline-flex rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
          >
            Start planning
          </a>
        </div>
      </section>

      <footer id="contact" className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold">Itenora</div>
              <div className="mt-1 text-sm text-gray-700">
                Questions? Email:{" "}
                <span className="font-medium">hello@itenora.com</span>
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

function PlannerCardFallback() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur md:p-8">
      <div className="text-sm text-gray-500">Loading planner...</div>
    </div>
  );
}