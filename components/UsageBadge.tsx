"use client";

import React from "react";

type Props = {
  plan: string;
  used: number;
  limit: number | "unlimited";
};

export default function UsageBadge({ plan, used, limit }: Props) {
  const isUnlimited = limit === "unlimited";

  return (
    <div className="rounded-xl border px-3 py-2 text-sm">
      <div className="font-medium capitalize">{plan} plan</div>

      {isUnlimited ? (
        <div className="text-green-600">Unlimited usage</div>
      ) : (
        <div className="text-gray-600">
          {used} / {limit} itineraries used
        </div>
      )}
    </div>
  );
}