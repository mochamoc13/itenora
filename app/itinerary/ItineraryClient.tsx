"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

function gmLink(q: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export default function ItineraryClient() {
  const sp = useSearchParams();

  // your existing state/fetch logic here...
  // const [data, setData] = React.useState(...)
  // const [error, setError] = React.useState(...)

  // TEMP: avoid empty file compile issues
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="rounded-2xl border p-5">Itinerary page loading…</div>
    </div>
  );
}