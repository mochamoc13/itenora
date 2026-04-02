import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = createSupabaseServerClient();

  const { data: trip } = await supabase
    .from("itineraries")
    .select("title, destination, budget, slug")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!trip) {
    return {
      title: "Trip not found | Itenora",
      description: "Shared itinerary page on Itenora.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = trip.title || `${trip.destination} itinerary`;
  const description = `This itinerary for ${trip.destination} includes day-by-day suggestions, attractions, food stops, and practical planning ideas to make the trip easier.`;

  return {
    title: `${title} | Itenora`,
    description,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/trips/share/${params.slug}`,
    },
    openGraph: {
      title: `${title} | Itenora`,
      description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/trips/share/${params.slug}`,
      siteName: "Itenora",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Itenora`,
      description,
    },
  };
}

export default async function PublicTripPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createSupabaseServerClient();

  const { data: trip } = await supabase
    .from("itineraries")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!trip) {
    return (
      <div className="mx-auto max-w-4xl p-10 text-center">
        <h1 className="text-2xl font-bold">Trip not found</h1>
        <p className="mt-4 text-gray-600">
          This itinerary may have expired or is no longer available.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 rounded-xl bg-black px-6 py-3 text-white"
        >
          Plan your own trip
        </Link>
      </div>
    );
  }

  const { data: relatedTrips } = await supabase
    .from("itineraries")
    .select("slug, title")
    .eq("destination", trip.destination)
    .neq("slug", params.slug)
    .not("slug", "is", null)
    .limit(5);

  const itinerary = Array.isArray(trip.generated_plan?.itinerary)
    ? trip.generated_plan.itinerary
    : [];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TravelItinerary",
    name: trip.title,
    description: `Travel itinerary for ${trip.destination}`,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/trips/share/${params.slug}`,
    itinerary: itinerary.map((day: any) => ({
      "@type": "ListItem",
      name: `Day ${day.day ?? ""}${day.theme ? ` - ${day.theme}` : ""}`,
      description: Array.isArray(day.stops)
        ? day.stops
            .map((stop: any) => `${stop.time ?? "Anytime"} ${stop.title ?? "Stop"}`)
            .join(", ")
        : "",
    })),
  };

  return (
    <main className="mx-auto max-w-4xl p-10 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <article className="space-y-10">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold">{trip.title} Itinerary</h1>

          <p className="text-lg leading-7 text-gray-700">
            This itinerary for {trip.destination} includes day-by-day
            suggestions, attractions, food stops, and practical planning ideas
            to make the trip easier.
          </p>

          <p className="text-base leading-7 text-gray-600">
            Use this itinerary as a flexible travel guide for what to do, where
            to go, and how to organise each day more smoothly.
          </p>
        </header>

        {itinerary.length > 0 ? (
          itinerary.map((day: any, index: number) => (
            <section key={day.day ?? index} className="border rounded-xl p-6 space-y-4">
              <h2 className="text-2xl font-semibold">
                Day {day.day ?? index + 1}
                {day.theme ? ` — ${day.theme}` : ""}
              </h2>

              <p className="text-gray-600">
                Explore the highlights planned for day {day.day ?? index + 1} in{" "}
                {trip.destination}.
              </p>

              <div className="space-y-3">
                {Array.isArray(day.stops) &&
                  day.stops.map((stop: any, i: number) => (
                    <div key={i} className="flex gap-4">
                      <div className="min-w-[56px] font-mono text-sm text-gray-500">
                        {stop.time || "Anytime"}
                      </div>

                      <div>
                        <div className="font-medium">
                          {stop.title || "Recommended stop"}
                        </div>

                        {stop.notes ? (
                          <div className="text-sm text-gray-500">{stop.notes}</div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            A suggested stop for this part of the itinerary.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          ))
        ) : (
          <section className="border rounded-xl p-6">
            <h2 className="text-2xl font-semibold">Itinerary details</h2>
            <p className="mt-3 text-gray-600">
              No itinerary details are currently available for this trip.
            </p>
          </section>
        )}

        {relatedTrips && relatedTrips.length > 0 && (
          <section className="border-t pt-10">
            <h2 className="mb-4 text-2xl font-semibold">
              More {trip.destination} itineraries
            </h2>

            <ul className="space-y-2">
              {relatedTrips.map((r: any) => (
                <li key={r.slug}>
                  <Link
                    href={`/trips/share/${r.slug}`}
                    className="text-blue-600 hover:underline"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="border-t pt-10 text-center">
          <p className="text-gray-600">
            ✨ This itinerary was generated by Itenora AI
          </p>

          <Link
            href="/"
            className="inline-block mt-4 rounded-xl bg-black px-6 py-3 text-white"
          >
            Plan your own trip
          </Link>
        </footer>
      </article>
    </main>
  );
}