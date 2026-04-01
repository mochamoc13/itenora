import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type AppPlan = "free" | "plus" | "pro";

/** ---------------- PLAN HELPERS ---------------- */

function getPlanFromPriceId(priceId: string | null | undefined): AppPlan {
  if (!priceId) return "free";
  if (priceId === process.env.STRIPE_PLUS_PRICE_ID) return "plus";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  return "free";
}

function getFreeMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function getSubscriptionItemPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];

  return {
    periodStart:
      typeof item?.current_period_start === "number"
        ? new Date(item.current_period_start * 1000).toISOString()
        : null,
    periodEnd:
      typeof item?.current_period_end === "number"
        ? new Date(item.current_period_end * 1000).toISOString()
        : null,
  };
}

function getPeriodKeyForPlan(plan: AppPlan, periodStart: string | null) {
  if ((plan === "plus" || plan === "pro") && periodStart) {
    return periodStart;
  }
  return getFreeMonthKey(new Date());
}

/** ---------------- DB HELPERS ---------------- */

async function ensureUsageBucket(params: {
  userId: string;
  plan: AppPlan;
  periodStart: string | null;
  periodEnd: string | null;
}) {
  const periodKey = getPeriodKeyForPlan(params.plan, params.periodStart);

  const { data: existing } = await supabaseAdmin
    .from("user_usage")
    .select("itineraries")
    .eq("user_id", params.userId)
    .eq("period_key", periodKey)
    .maybeSingle();

  await supabaseAdmin.from("user_usage").upsert(
    {
      user_id: params.userId,
      period_key: periodKey,
      period_start: params.periodStart,
      period_end: params.periodEnd,
      plan: params.plan,
      itineraries: existing?.itineraries ?? 0,
    },
    { onConflict: "user_id,period_key" }
  );
}

async function resetUsageBucket(params: {
  userId: string;
  plan: AppPlan;
  periodStart: string | null;
  periodEnd: string | null;
}) {
  const periodKey = getPeriodKeyForPlan(params.plan, params.periodStart);

  await supabaseAdmin.from("user_usage").upsert(
    {
      user_id: params.userId,
      period_key: periodKey,
      period_start: params.periodStart,
      period_end: params.periodEnd,
      plan: params.plan,
      itineraries: 0, // 🔥 RESET HERE
    },
    { onConflict: "user_id,period_key" }
  );
}

async function saveProfile(params: {
  userId: string;
  plan: AppPlan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  subscriptionStatus: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}) {
  await supabaseAdmin.from("profiles").upsert(
    {
      user_id: params.userId,
      plan: params.plan,
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      stripe_price_id: params.stripePriceId,
      subscription_status: params.subscriptionStatus,
      current_period_start: params.currentPeriodStart,
      current_period_end: params.currentPeriodEnd,
    },
    { onConflict: "user_id" }
  );
}

/** ---------------- EVENTS ---------------- */

async function upsertProfileFromCheckoutSession(session: Stripe.Checkout.Session) {
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items.data.price"],
  });

  const userId =
    fullSession.metadata?.clerkUserId ??
    fullSession.metadata?.clerk_user_id ??
    fullSession.client_reference_id ??
    null;

  if (!userId) return;

  const priceId = fullSession.line_items?.data?.[0]?.price?.id ?? null;
  const plan = getPlanFromPriceId(priceId);

  const stripeCustomerId =
    typeof fullSession.customer === "string"
      ? fullSession.customer
      : fullSession.customer?.id ?? null;

  const stripeSubscriptionId =
    typeof fullSession.subscription === "string"
      ? fullSession.subscription
      : fullSession.subscription?.id ?? null;

  let currentPeriodStart: string | null = null;
  let currentPeriodEnd: string | null = null;
  let subscriptionStatus = "active";

  if (stripeSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(
      stripeSubscriptionId
    );

    const period = getSubscriptionItemPeriod(subscription);

    currentPeriodStart = period.periodStart;
    currentPeriodEnd = period.periodEnd;
    subscriptionStatus = subscription.status;
  }

  await saveProfile({
    userId,
    plan,
    stripeCustomerId,
    stripeSubscriptionId,
    stripePriceId: priceId,
    subscriptionStatus,
    currentPeriodStart,
    currentPeriodEnd,
  });

  await ensureUsageBucket({
    userId,
    plan,
    periodStart: currentPeriodStart,
    periodEnd: currentPeriodEnd,
  });

  console.log("Checkout completed:", { userId, plan });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const plan = getPlanFromPriceId(priceId);

  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (!data?.user_id) return;

  const period = getSubscriptionItemPeriod(subscription);

  await saveProfile({
    userId: data.user_id,
    plan,
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    subscriptionStatus: subscription.status,
    currentPeriodStart: period.periodStart,
    currentPeriodEnd: period.periodEnd,
  });

  await ensureUsageBucket({
    userId: data.user_id,
    plan,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
  });

  console.log("Subscription updated:", data.user_id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (!data?.user_id) return;

  await saveProfile({
    userId: data.user_id,
    plan: "free",
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id ?? null,
    stripeSubscriptionId: subscription.id,
    stripePriceId: null,
    subscriptionStatus: "canceled",
    currentPeriodStart: null,
    currentPeriodEnd: null,
  });

  await ensureUsageBucket({
    userId: data.user_id,
    plan: "free",
    periodStart: null,
    periodEnd: null,
  });

  console.log("User downgraded:", data.user_id);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const plan = getPlanFromPriceId(priceId);

  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (!data?.user_id) return;

  const period = getSubscriptionItemPeriod(subscription);

  await saveProfile({
    userId: data.user_id,
    plan,
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    subscriptionStatus: subscription.status,
    currentPeriodStart: period.periodStart,
    currentPeriodEnd: period.periodEnd,
  });

  await resetUsageBucket({
    userId: data.user_id,
    plan,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
  });

  console.log("🔥 Usage reset for new billing cycle:", data.user_id);
}

/** ---------------- ROUTE ---------------- */

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await upsertProfileFromCheckoutSession(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log("Unhandled event:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler failed:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}