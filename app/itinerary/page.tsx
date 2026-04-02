import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import UsageSummary from "@/components/UsageSummary";
import ShareTripButton from "@/components/ShareTripButton";
import { addDays, buildBookingAffiliateLink } from "@/lib/affiliate";

export default async function ItineraryPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/itinerary");
  }

  const supabase = createSupabaseServerClient();

  const { data: trips, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase load error:", error);

    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">My Trips</h1>
        <p className="mt-4 text-red-600">Failed to load trips.</p>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </pre>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">My Trips</h1>
          <p className="mt-2 text-gray-600">
            Your saved itineraries, ready to open anytime.
          </p>

          <div className="mt-4 max-w-md">
            <UsageSummary />
          </div>
        </div>

        <Link
          href="/#planner"
          className="inline-flex rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          New Trip
        </Link>
      </div>

      {!trips || trips.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold">No trips yet</h2>
          <p className="mt-2 text-gray-600">
            Generate your first itinerary and it will show up here.
          </p>

          <Link
            href="/#planner"
            className="mt-6 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            Plan your first trip
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {trips.map((trip: any) => {
            const input = trip.generated_plan?.input ?? {};

            const days =
              typeof input.days === "number"
                ? input.days
                : Array.isArray(trip.generated_plan?.itinerary)
                  ? trip.generated_plan.itinerary.length
                  : null;

            const people = input.people ?? null;
            const budget = input.budget ?? trip.budget ?? null;

            const createdAt = trip.created_at
              ? new Date(trip.created_at).toLocaleDateString()
              : "";

            const destination = trip.destination || input.destination || "";

            const startDate = trip.start_date ?? input.startDate ?? undefined;

            const endDate =
              trip.end_date ??
              (startDate && days
                ? addDays(startDate, Math.max(days - 1, 0))
                : undefined);

            const bookingLink = buildBookingAffiliateLink({
              destination,
              checkIn: startDate,
              checkOut: endDate,
            });

            return (
              <div
                key={trip.id}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                      {trip.title || "Untitled Trip"}
                    </h2>

                    <p className="mt-1 text-gray-600">
                      {destination || "No destination"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
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

                      {startDate ? (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                          Hotel-ready
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                    <Link
  href={trip.slug ? `/trips/share/${trip.slug}` : `/share/${trip.id}`}
  className="inline-flex rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
>
  Open trip
</Link>

                      {destination ? (
                        <a
                          href={bookingLink}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="inline-flex rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                        >
                          Find hotels for this trip
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                    <div className="text-sm text-gray-500 sm:text-right">
                      <p>Created</p>
                      <p className="font-medium text-gray-700">{createdAt}</p>
                    </div>

                   <ShareTripButton slug={trip.slug} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}