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

async function getOrCreateCustomer(userId: string) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  let stripeCustomerId = profile?.stripe_customer_id ?? null;

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
      clerk_user_id: userId,
    },
  });

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("user_id", userId);

  if (updateError) throw new Error(updateError.message);

  return customer.id;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const plan = body?.plan === "pro" ? "pro" : "plus";

    const plusPrice = process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID;
    const proPrice = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;

    const priceId = plan === "pro" ? proPrice : plusPrice;

    if (!priceId) {
      return NextResponse.json(
        {
          error: `Missing Stripe price ID for ${plan}`,
          debug: {
            plan,
            plusPrice,
            proPrice,
          },
        },
        { status: 500 }
      );
    }

    const customerId = await getOrCreateCustomer(userId);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/trips`,
      cancel_url: `${siteUrl}/trips`,
      allow_promotion_codes: true,
      metadata: {
        clerk_user_id: userId,
        selected_plan: plan,
      },
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session";

    return NextResponse.json(
      {
        error: message,
        debug: {
          plusPrice: process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID,
          proPrice: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
        },
      },
      { status: 500 }
    );
  }
}