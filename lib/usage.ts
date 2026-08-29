import { createSupabaseServerClient } from "@/lib/supabase/server";

export const FREE_MONTHLY_LIMIT = 10;

export async function checkUsage(userId: string) {
  const supabase = createSupabaseServerClient();
  const periodKey = new Date().toISOString().slice(0, 7);

  const { data } = await supabase
    .from("user_usage")
    .select("itineraries")
    .eq("user_id", userId)
    .eq("period_key", periodKey)
    .maybeSingle();

  const used = data?.itineraries ?? 0;

  return {
    plan: "free" as const,
    used,
    limit: FREE_MONTHLY_LIMIT,
    allowed: used < FREE_MONTHLY_LIMIT,
  };
}
