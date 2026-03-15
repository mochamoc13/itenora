import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function checkUsage(userId: string) {
  const supabase = createSupabaseServerClient();
  const month = new Date().toISOString().slice(0, 7);

  const { data } = await supabase
    .from("user_usage")
    .select("plan, itineraries")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  const plan = data?.plan || "free";
  const used = data?.itineraries || 0;

  let limit = 2;
  if (plan === "plus") limit = 20;
  if (plan === "pro") limit = Infinity;

  return {
    plan,
    used,
    limit,
    allowed: used < limit,
  };
}