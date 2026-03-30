"use client";

import React from "react";
import Link from "next/link";
import PlanBadge from "@/components/PlanBadge";
import ManageBillingButton from "@/components/ManageBillingButton";

export default function AccountBillingArea() {
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

  return (
    <div className="flex items-center gap-3">
      {plan === "free" ? (
        <Link
          href="/trips"
          className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Upgrade
        </Link>
      ) : (
        <ManageBillingButton />
      )}
      <PlanBadge />
    </div>
  );
}