import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DownloadImageButton from "@/components/DownloadImageButton";

function getStopEmoji(title?: string, notes?: string) {
  const text = `${title ?? ""} ${notes ?? ""}`.toLowerCase();

  if (
    text.includes("ramen") ||
    text.includes("restaurant") ||
    text.includes("lunch") ||
    text.includes("dinner") ||
    text.includes("breakfast") ||
    text.includes("cafe") ||
    text.includes("food")
  ) {
    return "🍜";
  }

  if (
    text.includes("shop") ||
    text.includes("shopping") ||
    text.includes("market") ||
    text.includes("mall")
  ) {
    return "🛍️";
  }

  if (
    text.includes("museum") ||
    text.includes("temple") ||
    text.includes("park") ||
    text.includes("garden") ||
    text.includes("tower") ||
    text.includes("landmark") ||
    text.includes("shrine") ||
    text.includes("beach")
  ) {
    return "📍";
  }

  if (
    text.includes("anime") ||
    text.includes("pokemon") ||
    text.includes("arcade") ||
    text.includes("game")
  ) {
    return "🎮";
  }

  return "✨";
}

export default async function ShareTripPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();
  const supabase = createSupabaseServerClient();

  const query = supabase.from("itineraries").select("*").eq("id", params.id);

  const { data: trip, error } = userId
    ? await query.eq("user_id", userId).single()
    : await query.single();

  if (error || !trip) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Trip not found</h1>
          <p className="mt-2 text-gray-600">
            This itinerary may have been removed or the link is invalid.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Go to Itenora
          </Link>
        </div>
      </main>
    );
  }

  const itinerary = Array.isArray(trip.generated_plan?.itinerary)
    ? trip.generated_plan.itinerary
    : [];

  const input = trip.generated_plan?.input ?? {};
  const days =
    typeof input.days === "number"
      ? input.days
      : itinerary.length > 0
      ? itinerary.length
      : null;
  const people = input.people ?? null;
  const budget = input.budget ?? trip.budget ?? null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div
        id="itinerary-image"
        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {trip.title || trip.destination || "Shared Trip"}
        </h1>

        <p className="mt-2 text-gray-600">
          {trip.destination || "Trip itinerary"}
        </p>

        <div className="mt-4 flex justify-end">
          <DownloadImageButton />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
          {days ? (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">
              {days} day{days > 1 ? "s" : ""}
            </span>
          ) : null}

          {people ? (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">
              {people}
            </span>
          ) : null}

          {budget ? (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">
              {budget}
            </span>
          ) : null}
        </div>

        <div className="mt-8 space-y-8">
          {itinerary.length > 0 ? (
            itinerary.map((day: any, index: number) => (
              <section key={index}>
                <h2 className="text-xl font-semibold text-gray-900">
                  Day {day.day ?? index + 1}
                </h2>

                <div className="mt-4 space-y-4">
                  {Array.isArray(day.stops) &&
                    day.stops.map((stop: any, stopIndex: number) => {
                      const emoji = getStopEmoji(stop.title, stop.notes);

                      return (
                        <div
                          key={stopIndex}
                          className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                        >
                          <p className="text-sm font-medium text-gray-500">
                            {stop.time || "Anytime"}
                          </p>

                          <p className="mt-2 text-base font-semibold text-gray-900">
                            <span className="mr-2">{emoji}</span>
                            {stop.title || "Stop"}
                          </p>

                          {stop.notes ? (
                            <p className="mt-2 text-sm leading-6 text-gray-600">
                              {stop.notes}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                </div>
              </section>
            ))
          ) : (
            <p className="text-gray-600">No itinerary details available.</p>
          )}
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-500">
            ✨ Plan your own trip in seconds with{" "}
            <Link href="/" className="font-semibold text-gray-900 underline">
              Itenora
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}