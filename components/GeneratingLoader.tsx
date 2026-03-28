"use client";

type GeneratingLoaderProps = {
  destination?: string;
};

export default function GeneratingLoader({
  destination,
}: GeneratingLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6 h-44 w-44">
            {/* Globe */}
            <div className="absolute inset-0 animate-[spin_12s_linear_infinite] rounded-full border-4 border-blue-200 bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-50 shadow-inner">
              {/* Latitude / longitude lines */}
              <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-blue-200/70" />
              <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-blue-200/70" />
              <div className="absolute inset-3 rounded-full border border-blue-200/70" />
              <div className="absolute inset-7 rounded-full border border-blue-200/60" />
              <div className="absolute inset-0 rounded-full border border-blue-300/50" />
            </div>

            {/* Orbit path */}
            <div className="absolute inset-[-14px] rounded-full border border-dashed border-orange-300" />

            {/* Plane orbit wrapper */}
            <div className="absolute inset-[-14px] animate-[spin_4s_linear_infinite]">
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 text-3xl">
                ✈️
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Creating your itinerary...
          </h2>

          <p className="mt-3 text-sm text-gray-600">
            {destination
              ? `Planning your trip to ${destination}.`
              : "Planning your trip."}{" "}
            This usually takes 10–20 seconds.
          </p>

          <div className="mt-5 space-y-2 text-sm text-gray-500">
            <p className="animate-pulse">Finding top places to visit</p>
            <p className="animate-pulse [animation-delay:400ms]">
              Balancing your days and travel time
            </p>
            <p className="animate-pulse [animation-delay:800ms]">
              Matching your budget and interests
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}