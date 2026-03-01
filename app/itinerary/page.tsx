// app/itinerary/page.tsx
import { Suspense } from "react";
import ItineraryClient from "./ItineraryClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl p-6">Loading itinerary…</div>}>
      <ItineraryClient />
    </Suspense>
  );
}