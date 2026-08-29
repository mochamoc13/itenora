import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FREE_MONTHLY_LIMIT = 10;

function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({
      plan: "free",
      used: 0,
      limit: FREE_MONTHLY_LIMIT,
      usageLabel: `${FREE_MONTHLY_LIMIT} free itineraries each month`,
      periodType: "month",
    });
  }

  try {
    const supabase = createSupabaseServerClient();
    const periodKey = getMonthKey();

    const { data: usage, error } = await supabase
      .from("user_usage")
      .select("itineraries")
      .eq("user_id", userId)
      .eq("period_key", periodKey)
      .maybeSingle();

    if (error) {
      console.error("api/user/plan usage error:", error);
    }

    const used = usage?.itineraries ?? 0;

    return NextResponse.json({
      plan: "free",
      used,
      limit: FREE_MONTHLY_LIMIT,
      usageLabel: `${used} / ${FREE_MONTHLY_LIMIT} itineraries used this month`,
      periodType: "month",
    });
  } catch (error) {
    console.error("api/user/plan unexpected error:", error);

    return NextResponse.json({
      plan: "free",
      used: 0,
      limit: FREE_MONTHLY_LIMIT,
      usageLabel: `${FREE_MONTHLY_LIMIT} free itineraries each month`,
      periodType: "month",
    });
  }
}
