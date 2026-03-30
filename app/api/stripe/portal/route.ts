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

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("plan, stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const plan = (profile?.plan as AppPlan | null) ?? "free";
    let stripeCustomerId = profile?.stripe_customer_id ?? null;

    if (plan === "free") {
      return NextResponse.json(
        { error: "No active paid plan found. Please upgrade first." },
        { status: 400 }
      );
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found for this account." },
        { status: 400 }
      );
    }

    try {
      const existing = await stripe.customers.retrieve(stripeCustomerId);

      if ("deleted" in existing && existing.deleted) {
        return NextResponse.json(
          { error: "Stripe customer record is no longer available." },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Unable to verify Stripe customer." },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${siteUrl}/trips`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create billing portal";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}