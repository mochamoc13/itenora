export const dynamic = "force-dynamic";

import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ShareTripButton from "@/components/ShareTripButton";
import DownloadImageButton from "@/components/DownloadImageButton";
import {
  buildHotelAffiliateLink,
  buildKlookActivityLink,
  isBookableActivity,
  addDays,
} from "@/lib/affiliate";

type TripPageProps = {
  params: {
    id: string;
  };
};

function isValidDateString(value?: string | null) {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getMeaningfulStayArea(stops: any[], destination: string) {
  if (!Array.isArray(stops)) return "";

  const destinationLower = cleanText(destination).toLowerCase();

  for (const stop of stops) {
    const area = cleanText(stop?.area);
    if (!area) continue;

    const areaLower = area.toLowerCase();

    if (destinationLower && areaLower === destinationLower) continue;

    if (
      areaLower === "city center" ||
      areaLower === "city centre" ||
      areaLower === "downtown" ||
      areaLower === "central"
    ) {
      continue;
    }

    return area;
  }

  return "";
}

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

  const itinerary = Array.isArray(trip.generated_plan?.itinerary)
    ? trip.generated_plan.itinerary
    : [];

  const input = trip.generated_plan?.input ?? {};
  const hasValidStartDate = isValidDateString(input.startDate);

  const editParams = new URLSearchParams();

  if (input.destination) editParams.set("destination", input.destination);
  if (input.days) editParams.set("days", String(input.days));
  if (input.people) editParams.set("people", input.people);
  if (input.budget) editParams.set("budget", input.budget);
  if (input.startDate) editParams.set("startDate", input.startDate);
  if (input.arrivalTime) editParams.set("arrivalTime", input.arrivalTime);
  if (input.departTime) editParams.set("departTime", input.departTime);
  if (input.childAges) editParams.set("childAges", input.childAges);
  if (input.pace) editParams.set("pace", input.pace);
  if (Array.isArray(input.interests) && input.interests.length > 0) {
    editParams.set("interests", input.interests.join(","));
  }

  const editHref = `/?${editParams.toString()}#planner`;
  const tripDestination = cleanText(trip.destination);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div
        id="itinerary-image"
        className="relative overflow-hidden rounded-[28px] border border-black/10 bg-white p-5 shadow-sm sm:p-8"
      >
        <div className="absolute right-4 top-4 z-10">
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur">
            <Image
              src="/itenora-logo.svg"
              alt="Itenora"
              width={18}
              height={18}
              className="h-[18px] w-[18px]"
            />
            <span className="text-xs font-semibold text-gray-800">
              itenora.com
            </span>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-black/10 bg-gradient-to-br from-purple-50 via-white to-orange-50 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl pr-0 sm:pr-28">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                <Image
                  src="/itenora-logo.svg"
                  alt="Itenora"
                  width={14}
                  height={14}
                  className="h-[14px] w-[14px]"
                />
                <span>AI travel plan</span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {trip.title || "Untitled Trip"}
              </h1>

              <p className="mt-2 text-base text-gray-600">
                {trip.destination || "No destination"}
              </p>

              <p className="mt-3 text-sm text-gray-500">
                Planned in seconds with Itenora. Save it, share it, and travel
                smarter.
              </p>

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

            <div className="flex flex-wrap gap-3">
              <ShareTripButton tripId={trip.id} />
              <DownloadImageButton />

              <a
                href={editHref}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Edit Trip
              </a>

              <form action={`/api/trips/${trip.id}/delete`} method="POST">
                <button
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  type="submit"
                >
                  Delete Trip
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            Tip: Save or share this trip before opening Google Maps, especially
            if you came from Instagram or Facebook.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Google Maps opens in a new tab, so your itinerary stays here.
          </p>
        </div>

        <div className="space-y-8">
          {itinerary.map((day: any, dayIndex: number) => {
            const dayStops = Array.isArray(day.stops) ? day.stops : [];
            const meaningfulArea = getMeaningfulStayArea(dayStops, tripDestination);
            const displayArea = meaningfulArea || tripDestination;

            const showHotelBox = Boolean(tripDestination);

            const checkIn =
              hasValidStartDate && input.startDate
                ? addDays(input.startDate, dayIndex)
                : undefined;

            const checkOut =
              hasValidStartDate && input.startDate
                ? addDays(input.startDate, dayIndex + 1)
                : undefined;

            const hotelLink = buildHotelAffiliateLink({
              destination: tripDestination,
              area: meaningfulArea || undefined,
              checkIn,
              checkOut,
            });

            return (
              <section
                key={day.day ?? dayIndex}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Day {day.day ?? dayIndex + 1}
                      {day.theme ? ` — ${day.theme}` : ""}
                    </h2>

                    {day.date ? (
                      <p className="mt-1 text-sm text-gray-500">{day.date}</p>
                    ) : null}
                  </div>

                  <div className="text-sm text-gray-500">
                    Daily est. total: ~{day.dailyCostEstimate ?? 0}
                  </div>
                </div>

                {showHotelBox ? (
                  <div className="mb-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                    <p className="text-sm font-semibold text-orange-900">
                      Stay recommendation
                    </p>

                    <p className="mt-1 text-sm text-orange-800">
                      {meaningfulArea ? (
                        <>
                          Staying in{" "}
                          <span className="font-semibold">{displayArea}</span> is
                          a good fit for this day’s plan.
                        </>
                      ) : (
                        <>
                          View hotel options in{" "}
                          <span className="font-semibold">{tripDestination}</span>
                          .
                        </>
                      )}
                    </p>

                    <a
                      href={hotelLink}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="mt-3 inline-flex rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                    >
                      {meaningfulArea
                        ? `Find hotels in ${displayArea}`
                        : `Find hotels in ${tripDestination}`}
                    </a>
                  </div>
                ) : null}

                <div className="space-y-4">
                  {dayStops.map((stop: any, index: number) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-500">
                            {stop.time || "Anytime"}
                            {stop.area ? ` • ${stop.area}` : ""}
                          </div>

                          <h3 className="mt-1 text-lg font-semibold text-gray-900">
                            {stop.title || "Stop"}
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

                <div className="mt-3 flex flex-wrap gap-4 items-center">
  <a
    href={`https://maps.google.com/?q=${encodeURIComponent(
      stop.mapQuery ||
        `${stop.title || "Stop"}, ${trip.destination || ""}`
    )}`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-sm font-medium text-blue-600 hover:underline"
  >
    Open on Google Maps
  </a>

  {isBookableActivity(stop.title) && (
    <a
      href={buildKlookActivityLink(stop.title, trip.destination)}
      target="_blank"
      rel="noopener noreferrer sponsored"
     className="inline-flex items-center rounded-lg bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200"
    >
      Check price on Klook → skip queues
    </a>
  )}

  <span className="w-full text-xs text-gray-500">
    Opens in a new tab so you can keep this itinerary open.
  </span>
</div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-black/10 bg-gray-50 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/itenora-logo.svg"
                alt="Itenora"
                width={18}
                height={18}
                className="h-[18px] w-[18px]"
              />
              <span className="text-sm font-semibold text-gray-900">
                Created with Itenora
              </span>
            </div>

            <div className="text-sm text-gray-600">
              Build your own trip at{" "}
              <span className="font-semibold text-gray-900">itenora.com</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}