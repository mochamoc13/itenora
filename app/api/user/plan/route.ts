import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AppPlan = "free" | "plus" | "pro";

function isPaidPlan(plan: AppPlan) {
  return plan === "plus" || plan === "pro";
}

function getPlanLimit(plan: AppPlan) {
  if (plan === "pro") return Infinity;
  if (plan === "plus") return 20;
  return 4;
}

function getFreeMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function parseSupabaseDate(value?: string | null) {
  if (!value) return null;

  let normalized = value.replace(" ", "T");

  if (/([+-]\d{2})$/.test(normalized)) {
    normalized = normalized.replace(/([+-]\d{2})$/, "$1:00");
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        plan: "free",
        used: 0,
        limit: 4,
        usageLabel: "0 / 4 itineraries used this month",
        periodType: "month",
      });
    }

    const supabase = createSupabaseServerClient();
    const now = new Date();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan, subscription_status, current_period_start, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("api/user/plan profile error:", profileError);

      return NextResponse.json({
        plan: "free",
        used: 0,
        limit: 4,
        usageLabel: "0 / 4 itineraries used this month",
        periodType: "month",
      });
    }

    const rawPlan = (profile?.plan ?? "free") as AppPlan;
    const currentPeriodStart = parseSupabaseDate(profile?.current_period_start);
    const currentPeriodEnd = parseSupabaseDate(profile?.current_period_end);

    const paidActive =
      isPaidPlan(rawPlan) &&
      (profile?.subscription_status === "active" ||
        profile?.subscription_status === "trialing") &&
      currentPeriodStart !== null &&
      currentPeriodEnd !== null &&
      now >= currentPeriodStart &&
      now < currentPeriodEnd;

    const effectivePlan: AppPlan = paidActive ? rawPlan : "free";
    const limit = getPlanLimit(effectivePlan);

    const periodKey = paidActive
      ? currentPeriodStart.toISOString()
      : getFreeMonthKey(now);

    const { data: usage, error: usageError } = await supabase
      .from("user_usage")
      .select("itineraries")
      .eq("user_id", userId)
      .eq("period_key", periodKey)
      .maybeSingle();

    if (usageError) {
      console.error("api/user/plan usage error:", usageError);
    }

    const used = usage?.itineraries ?? 0;

    return NextResponse.json({
      plan: effectivePlan,
      used,
      limit: limit === Infinity ? "unlimited" : limit,
      usageLabel:
        limit === Infinity
          ? `${used} itineraries used this billing period`
          : `${used} / ${limit} itineraries used ${
              paidActive ? "this billing period" : "this month"
            }`,
      periodType: paidActive ? "billing_period" : "month",
      currentPeriodStart: paidActive ? currentPeriodStart?.toISOString() : null,
      currentPeriodEnd: paidActive ? currentPeriodEnd?.toISOString() : null,
    });
  } catch (error) {
    console.error("api/user/plan unexpected error:", error);

    return NextResponse.json({
      plan: "free",
      used: 0,
      limit: 4,
      usageLabel: "0 / 4 itineraries used this month",
      periodType: "month",
    });
  }
}