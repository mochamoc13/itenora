"use client";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gray-900" />
            <span className="text-lg font-semibold tracking-tight">Itenora</span>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-gray-700 md:flex">
            <a className="hover:text-gray-900" href="#how">
              How it works
            </a>
            <a className="hover:text-gray-900" href="#features">
              Features
            </a>
            <a className="hover:text-gray-900" href="#pricing">
              Pricing
            </a>
            <a className="hover:text-gray-900" href="#contact">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 md:inline-flex"
              href="#pricing"
            >
              View pricing
            </a>
            <a
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
              href="#cta"
            >
              Generate my itinerary
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
              AI itinerary generator — coming soon
            </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
  Plan epic trips without blowing your budget.
</h1>

<p className="mt-4 text-lg text-gray-700">
  Tell us where you’re going and how much you want to spend.
  Itenora builds a smart, budget-friendly itinerary in minutes —
  so you save time, money, and planning stress.
</p>


            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#cta"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black"
              >
                Generate my itinerary
              </a>
              <a
                href="#how"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                See how it works
              </a>
            </div>

            <div className="mt-6 flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                Fast planning
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                Budget-friendly
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-purple-500" />
                Mobile-first
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-semibold text-gray-500">Example output</p>
              <h3 className="mt-2 text-lg font-semibold">3-day Tokyo (budget pace)</h3>

              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="font-semibold">Day 1</div>
                  <div className="mt-1">Asakusa • Senso-ji • Ueno Park • Local ramen</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="font-semibold">Day 2</div>
                  <div className="mt-1">Meiji Shrine • Harajuku • Shibuya sunset</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="font-semibold">Day 3</div>
                  <div className="mt-1">Tsukiji • TeamLab • Odaiba waterfront</div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600">
                Includes: transport tips • cost estimates • food picks • map-friendly stops
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Tell us your trip",
                desc: "City, dates, budget, travel style, and interests.",
              },
              {
                title: "We generate a plan",
                desc: "A day-by-day itinerary with smart suggestions.",
              },
              {
                title: "You customise it",
                desc: "Edit, save, share, and export anytime.",
              },
            ].map((x) => (
              <div
                key={x.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="text-lg font-semibold">{x.title}</div>
                <div className="mt-2 text-sm text-gray-700">{x.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Features</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            {
              title: "Budget-aware suggestions",
              desc: "Get options that match your budget — from free spots to paid attractions.",
            },
            {
              title: "Pace controls",
              desc: "Relaxed, normal, or packed — itineraries that fit your energy.",
            },
            {
              title: "Map-friendly stops",
              desc: "Stops grouped logically to reduce travel time between places.",
            },
            {
              title: "Mobile-first experience",
              desc: "Designed for quick changes while you’re on the move.",
            },
          ].map((x) => (
            <div
              key={x.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="text-lg font-semibold">{x.title}</div>
              <div className="mt-2 text-sm text-gray-700">{x.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing (placeholder) */}
      <section id="pricing" className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Pricing</h2>
          <p className="mt-3 text-gray-700">
            We’re finalising pricing. Start with a free plan, upgrade when you need more.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { name: "Free", price: "$0", points: ["Basic itineraries", "Save 1 trip", "Email support"] },
              { name: "Plus", price: "TBA", points: ["Unlimited trips", "Faster generation", "Export + share"] },
              { name: "Pro", price: "TBA", points: ["Team sharing", "Advanced preferences", "Priority support"] },
            ].map((p) => (
              <div key={p.name} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-lg font-semibold">{p.name}</div>
                <div className="mt-2 text-3xl font-semibold">{p.price}</div>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  {p.points.map((pt) => (
                    <li key={pt}>• {pt}</li>
                  ))}
                </ul>
                <a
                  href="#cta"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                >
                  Get started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight">Want early access?</h2>
          <p className="mt-3 text-gray-700">
            Leave your email and we’ll notify you when the AI itinerary generator is ready.
          </p>

          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thanks! We’ll be in touch soon.");
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
              className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black"
            >
              Notify me
            </button>
          </form>

          <p className="mt-3 text-xs text-gray-500">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* Contact + Footer */}
      <footer id="contact" className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold">Itenora</div>
              <div className="mt-1 text-sm text-gray-700">
                Questions? Email: <span className="font-medium">hello@itenora.com</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">© {new Date().getFullYear()} Itenora. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}