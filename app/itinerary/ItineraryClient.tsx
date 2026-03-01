    "use client";

import React from "react";
import { useSearchParams } from "next/navigation";

export default function ItineraryClient() {
  const sp = useSearchParams();

  const destination = sp.get("destination") ?? "Tokyo";
  const days = Number(sp.get("days") ?? "3");
  const people = sp.get("people") ?? "family";
  const budget = sp.get("budget") ?? "budget";
  const pace = sp.get("pace") ?? "balanced";
  const interests = (sp.get("interests") ?? "").split(",").filter(Boolean);

  // TODO: render your existing itinerary UI here
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Itinerary</h1>
      <p className="mt-2 text-sm text-gray-600">
        {days}-day trip to {destination} • {people} • {budget} • {pace}
      </p>

      {interests.length ? (
        <p className="mt-2 text-sm">Interests: {interests.join(", ")}</p>
      ) : null}
    </main>
  );
}