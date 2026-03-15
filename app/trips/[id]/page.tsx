import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TripPageProps = {
  params: {
    id: string;
  };
};

export default async function TripDetailPage({ params }: TripPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/itinerary");
  }

  const supabase = createSupabaseServerClient();

  const { data: trip, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (error || !trip) {
    notFound();
  }

  const itinerary = trip.generated_plan?.itinerary ?? [];
  const input = trip.generated_plan?.input ?? {};

  const editParams = new URLSearchParams();

  if (input.destination) editParams.set("destination", input.destination);
  if (input.days) editParams.set("days", String(input.days));
  if (input.people) editParams.set("people", input.people);
  if (input.budget) editParams.set("budget", input.budget);
  if (input.startDate) editParams.set("startDate", input.startDate);
  if (input.arrivalTime) editParams.set("arrivalTime", input.arrivalTime);
  if (input.departTime) editParams.set("departTime", input.departTime);
  if (input.childAges) editParams.set("childAges", input.childAges);
  if (Array.isArray(input.interests) && input.interests.length > 0) {
    editParams.set("interests", input.interests.join(","));
  }

  const editHref = `/?${editParams.toString()}#planner`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {trip.title || "Untitled Trip"}
            </h1>

            <p className="mt-2 text-gray-600">
              {trip.destination || "No destination"}
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href={editHref}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Edit Trip
            </a>

            <form action={`/api/trips/${trip.id}/delete`} method="POST">
              <button
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                type="submit"
              >
                Delete Trip
              </button>
            </form>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
          {input.pace ? (
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
              Pace: {input.pace}
            </span>
          ) : null}

          {input.people ? (
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
              People: {input.people}
            </span>
          ) : null}

          {input.budget ? (
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
              Budget: {input.budget}
            </span>
          ) : null}

          {Array.isArray(input.interests) && input.interests.length > 0 ? (
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
              Interests: {input.interests.join(", ")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-8">
        {itinerary.map((day: any) => (
          <section
            key={day.day}
            className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Day {day.day} — {day.theme}
                </h2>
                {day.date ? (
                  <p className="mt-1 text-sm text-gray-500">{day.date}</p>
                ) : null}
              </div>

              <div className="text-sm text-gray-500">
                Daily est. total: ~{day.dailyCostEstimate ?? 0}
              </div>
            </div>

            <div className="space-y-4">
              {day.stops?.map((stop: any, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        {stop.time}
                        {stop.area ? ` • ${stop.area}` : ""}
                      </div>

                      <h3 className="mt-1 text-lg font-semibold text-gray-900">
                        {stop.title}
                      </h3>

                      {stop.notes ? (
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                          {stop.notes}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-sm text-gray-500">
                      ~{stop.costEstimate ?? 0}
                    </div>
                  </div>

                  <div className="mt-3">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        stop.mapQuery || `${stop.title}, ${trip.destination || ""}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Open on Google Maps
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}