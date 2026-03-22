import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ManageBillingButton from "@/components/ManageBillingButton";

function getPlanLabel(plan: string) {
  if (plan === "pro") return "Pro";
  if (plan === "plus") return "Plus";
  return "Free";
}

function getPlanLimit(plan: string) {
  if (plan === "pro") return 100;
  if (plan === "plus") return 20;
  return 4;
}

export default async function UsageSummary() {
  const { userId } = await auth();

  if (!userId) return null;

  const supabase = createSupabaseServerClient();
  const month = new Date().toISOString().slice(0, 7);

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: usage } = await supabase
    .from("user_usage")
    .select("itineraries, plan")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  const plan = usage?.plan || profile?.plan || "free";
  const used = usage?.itineraries || 0;
  const limit = getPlanLimit(plan);
  const planLabel = getPlanLabel(plan);

  const usagePercent =
    limit === Infinity ? 0 : Math.min(100, Math.round((used / limit) * 100));

  const usageBarClass =
    limit === Infinity
      ? "bg-blue-500"
      : usagePercent >= 80
      ? "bg-red-500"
      : usagePercent >= 50
      ? "bg-yellow-500"
      : "bg-gray-900";

  const helperText =
    limit === Infinity
      ? "Unlimited itineraries on your Pro plan."
      : usagePercent >= 80
      ? "You’re close to your monthly limit."
      : usagePercent >= 50
      ? "You’re halfway through your monthly usage."
      : "You still have plenty of trips left this month.";

  const showFreeNearLimit = plan === "free" && used >= 2 && used < limit;
  const showFreeAtLimit = plan === "free" && used >= limit;
  const showPlusNearLimit = plan === "plus" && used >= 15 && used < limit;
  const showPlusAtLimit = plan === "plus" && used >= limit;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                plan === "pro"
                  ? "bg-purple-100 text-purple-700"
                  : plan === "plus"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {planLabel.toUpperCase()} PLAN
            </span>

            <span className="text-sm text-gray-600">
              {limit === Infinity
                ? `${used} itineraries used this month`
                : `${used} / ${limit} itineraries used this month`}
            </span>
          </div>

          {limit !== Infinity ? (
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full transition-all ${usageBarClass}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          ) : (
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div className={`h-full w-full rounded-full ${usageBarClass}`} />
            </div>
          )}

          <div className="mt-2 text-xs text-gray-500">{helperText}</div>
        </div>

        <ManageBillingButton />
      </div>

      {showFreeNearLimit && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-800">
            You’re getting close to your free limit
          </div>
          <div className="mt-1 text-sm text-amber-700">
            Upgrade to Plus for 20 itineraries per month, exports, and more saved trips.
          </div>
          <a
            href="/#pricing"
            className="mt-3 inline-flex rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
          >
            View Plus plan
          </a>
        </div>
      )}

      {showFreeAtLimit && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="text-sm font-semibold text-red-800">
            You’ve reached your free monthly limit
          </div>
          <div className="mt-1 text-sm text-red-700">
            Upgrade to Plus to keep generating itineraries this month.
          </div>
          <a
            href="/#pricing"
            className="mt-3 inline-flex rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
          >
            Upgrade now
          </a>
        </div>
      )}

      {showPlusNearLimit && (
        <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50 p-4">
          <div className="text-sm font-semibold text-purple-800">
            You’re using Itenora a lot this month
          </div>
          <div className="mt-1 text-sm text-purple-700">
            Pro gives you unlimited itineraries*, advanced editing, smart preferences, and regenerate-by-day.
          </div>
          <a
            href="/#pricing"
            className="mt-3 inline-flex rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
          >
            See Pro
          </a>
        </div>
      )}

      {showPlusAtLimit && (
        <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50 p-4">
          <div className="text-sm font-semibold text-purple-800">
            You’ve reached your Plus monthly limit
          </div>
          <div className="mt-1 text-sm text-purple-700">
            Upgrade to Pro for unlimited itineraries*, advanced editing, smart preferences, and priority processing.
          </div>
          <a
            href="/#pricing"
            className="mt-3 inline-flex rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
          >
            Upgrade to Pro
          </a>
        </div>
      )}

      {plan === "pro" && (
        <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50 p-4">
          <div className="text-sm font-semibold text-purple-800">
            You’re on Pro
          </div>
          <div className="mt-1 text-sm text-purple-700">
            Enjoy advanced editing, smart preferences, regenerate specific days, and priority processing.
          </div>
          <div className="mt-2 text-xs text-purple-600">*Fair usage applies</div>
        </div>
      )}
    </div>
  );
}