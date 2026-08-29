import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FREE_MONTHLY_LIMIT } from "@/lib/usage";

export default async function UsageSummary() {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createSupabaseServerClient();
  const periodKey = new Date().toISOString().slice(0, 7);

  const { data: usage, error } = await supabase
    .from("user_usage")
    .select("itineraries")
    .eq("user_id", userId)
    .eq("period_key", periodKey)
    .maybeSingle();

  if (error) {
    console.error("UsageSummary usage error:", error);
    return null;
  }

  const used = usage?.itineraries ?? 0;
  const remaining = Math.max(0, FREE_MONTHLY_LIMIT - used);
  const usagePercent = Math.min(
    100,
    Math.round((used / FREE_MONTHLY_LIMIT) * 100)
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Free member
          </div>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            Your monthly itineraries
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {used} / {FREE_MONTHLY_LIMIT} used this month
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {remaining} trip{remaining === 1 ? "" : "s"} remaining
          </p>
        </div>
        <span className="text-xs text-gray-500">Up to 3 per day</span>
      </div>

      <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${
            usagePercent >= 90
              ? "bg-red-500"
              : usagePercent >= 60
                ? "bg-amber-500"
                : "bg-gray-900"
          }`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      {remaining === 0 ? (
        <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
          Your free allowance refreshes automatically next month.
        </p>
      ) : null}
    </div>
  );
}
