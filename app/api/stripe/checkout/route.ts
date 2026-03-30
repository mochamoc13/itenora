import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type AppPlan = "free" | "plus" | "pro";

async function getProfile(userId: string) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("plan, stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    plan: (profile?.plan as AppPlan | null) ?? "free",
    stripeCustomerId: profile?.stripe_customer_id ?? null,
  };
}

async function getOrCreateCustomer(userId: string) {
  const profile = await getProfile(userId);
  let stripeCustomerId = profile.stripeCustomerId;

  if (stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(stripeCustomerId);
      if (!("deleted" in existing && existing.deleted)) {
        return stripeCustomerId;
      }
    } catch {
      stripeCustomerId = null;
    }
  }

  const customer = await stripe.customers.create({
    metadata: {
      clerkUserId: userId,
    },
  });

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("user_id", userId);

  if (updateError) throw new Error(updateError.message);

  return customer.id;
}

async function findActiveSubscription(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });

  return (
    subscriptions.data.find((sub) =>
      ["active", "trialing", "past_due", "unpaid"].includes(sub.status)
    ) ?? null
  );
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const requestedPlan: AppPlan =
      body?.plan === "pro" ? "pro" : body?.plan === "plus" ? "plus" : "free";

    if (requestedPlan === "free") {
      return NextResponse.json(
        { error: "Free plan does not use checkout" },
        { status: 400 }
      );
    }

    const plusPrice = process.env.STRIPE_PLUS_PRICE_ID;
    const proPrice = process.env.STRIPE_PRO_PRICE_ID;
    const targetPriceId = requestedPlan === "pro" ? proPrice : plusPrice;

    if (!targetPriceId) {
      return NextResponse.json(
        { error: `Missing Stripe price ID for ${requestedPlan}` },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const profile = await getProfile(userId);
    const customerId = await getOrCreateCustomer(userId);

    if (profile.plan === requestedPlan) {
      return NextResponse.json({
        url: `${siteUrl}/trips`,
      });
    }

    if (profile.plan === "plus" && requestedPlan === "pro") {
      const activeSubscription = await findActiveSubscription(customerId);

      if (!activeSubscription) {
        return NextResponse.json(
          { error: "No active Plus subscription found to upgrade." },
          { status: 400 }
        );
      }

      const subscriptionItem = activeSubscription.items.data[0];

      if (!subscriptionItem) {
        return NextResponse.json(
          { error: "No subscription item found to upgrade." },
          { status: 400 }
        );
      }

      await stripe.subscriptions.update(activeSubscription.id, {
        items: [
          {
            id: subscriptionItem.id,
            price: targetPriceId,
          },
        ],
        proration_behavior: "create_prorations",
      });

      return NextResponse.json({
        url: `${siteUrl}/trips`,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: targetPriceId, quantity: 1 }],
      success_url: `${siteUrl}/trips`,
      cancel_url: `${siteUrl}/trips`,
      allow_promotion_codes: true,
      client_reference_id: userId,
      metadata: {
        clerkUserId: userId,
        selectedPlan: requestedPlan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}