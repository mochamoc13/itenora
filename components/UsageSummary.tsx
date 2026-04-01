import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ManageBillingButton from "@/components/ManageBillingButton";
import UpgradePlanButton from "@/components/UpgradePlanButton";

type AppPlan = "free" | "plus" | "pro";

function getPlanLabel(plan: AppPlan) {
  if (plan === "pro") return "Pro";
  if (plan === "plus") return "Plus";
  return "Free";
}

function getPlanLimit(plan: AppPlan) {
  if (plan === "pro") return Infinity;
  if (plan === "plus") return 20;
  return 4;
}

function isPaidPlan(plan: AppPlan) {
  return plan === "plus" || plan === "pro";
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

export default async function UsageSummary() {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createSupabaseServerClient();
  const now = new Date();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, subscription_status, current_period_start, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("UsageSummary profile error:", profileError);
    return null;
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
    console.error("UsageSummary usage error:", usageError);
    return null;
  }

  const used = usage?.itineraries ?? 0;
  const planLabel = getPlanLabel(effectivePlan);

  const remaining =
    limit === Infinity ? "Unlimited" : Math.max(0, limit - used);

  const usagePercent =
    limit === Infinity ? 0 : Math.min(100, Math.round((used / limit) * 100));

  const usageBarClass =
    limit === Infinity
      ? "bg-purple-500"
      : usagePercent >= 80
        ? "bg-red-500"
        : usagePercent >= 50
          ? "bg-yellow-500"
          : "bg-gray-900";

  const usagePeriodLabel = paidActive ? "Current billing period" : "This month";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              effectivePlan === "pro"
                ? "bg-purple-100 text-purple-700"
                : effectivePlan === "plus"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
            }`}
          >
            {planLabel} Plan
          </div>

          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            Your plan
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            {limit === Infinity
              ? `${used} itineraries used ${paidActive ? "this billing period" : "this month"}`
              : `${used} / ${limit} itineraries used ${paidActive ? "this billing period" : "this month"}`}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {remaining} trips left {paidActive ? "this billing period" : "this month"}
          </p>

          {paidActive && currentPeriodEnd ? (
            <p className="mt-1 text-xs text-gray-400">
              Renews on {currentPeriodEnd.toLocaleDateString("en-AU")}
            </p>
          ) : null}
        </div>

        {effectivePlan !== "free" ? <ManageBillingButton /> : null}
      </div>

      <div className="mt-5">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${usageBarClass}`}
            style={{
              width: limit === Infinity ? "100%" : `${usagePercent}%`,
            }}
          />
        </div>

        <div className="mt-3 flex justify-between text-xs text-gray-500">
          <span>{usagePeriodLabel} usage</span>
          <span>
            {limit === Infinity ? "Unlimited" : `${usagePercent}% used`}
          </span>
        </div>
      </div>

      {effectivePlan === "free" && used >= 2 && used < limit && (
        <UpgradeBox
          title="You’re getting close to your free limit"
          desc="Upgrade to Plus for 20 itineraries per month, exports, and more saved trips."
          button={<UpgradePlanButton plan="plus" label="Upgrade to Plus" />}
        />
      )}

      {effectivePlan === "free" && used >= limit && (
        <UpgradeBox
          title="You’ve reached your free monthly limit"
          desc="Upgrade to Plus to keep generating itineraries this month."
          button={<UpgradePlanButton plan="plus" label="Upgrade now" />}
        />
      )}

      {effectivePlan === "plus" && used >= 15 && used < limit && (
        <UpgradeBox
          title="You’re using Itenora a lot this billing period"
          desc="Pro gives you unlimited itineraries, advanced editing, and smarter planning."
          button={<UpgradePlanButton plan="pro" label="See Pro" />}
        />
      )}

      {effectivePlan === "plus" && used >= limit && (
        <UpgradeBox
          title="You’ve reached your Plus billing-period limit"
          desc="Upgrade to Pro for unlimited itineraries and priority processing."
          button={<UpgradePlanButton plan="pro" label="Upgrade to Pro" />}
        />
      )}

      {effectivePlan === "pro" && (
        <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50 p-4">
          <div className="text-sm font-semibold text-purple-800">
            You’re on Pro
          </div>
          <div className="mt-1 text-sm text-purple-700">
            Enjoy unlimited itineraries, advanced editing, and priority processing.
          </div>
        </div>
      )}
    </div>
  );
}

function UpgradeBox({
  title,
  desc,
  button,
}: {
  title: string;
  desc: string;
  button: React.ReactNode;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="mt-1 text-sm text-gray-600">{desc}</div>
      <div className="mt-3">{button}</div>
    </div>
  );
}