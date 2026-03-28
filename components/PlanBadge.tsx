"use client";

import React from "react";

export default function PlanBadge() {
  const [plan, setPlan] = React.useState("free");

  React.useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        const res = await fetch("/api/user/plan", { cache: "no-store" });
        const data = await res.json();

        if (!cancelled) {
          setPlan(data?.plan || "free");
        }
      } catch {
        if (!cancelled) {
          setPlan("free");
        }
      }
    }

    loadPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  const styles =
    plan === "pro"
      ? "bg-purple-100 text-purple-700"
      : plan === "plus"
      ? "bg-blue-100 text-blue-700"
      : "bg-gray-100 text-gray-600";

  return (
    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {plan.toUpperCase()}
    </div>
  );
}