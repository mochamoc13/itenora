import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getPlanFromPriceId(priceId: string | null | undefined) {
  if (!priceId) return "free";

  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID) {
    return "plus";
  }

  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
    return "pro";
  }

  return "free";
}

async function updateUserPlan(userId: string, plan: string) {
  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      user_id: userId,
      plan,
    },
    { onConflict: "user_id" }
  );

  if (profileError) {
    console.error("Profile update error:", profileError);
    throw new Error(profileError.message);
  }

  const month = new Date().toISOString().slice(0, 7);

  const { data: usageRow, error: usageReadError } = await supabaseAdmin
    .from("user_usage")
    .select("itineraries")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (usageReadError) {
    console.error("Usage read error:", usageReadError);
    throw new Error(usageReadError.message);
  }

  const { error: usageUpsertError } = await supabaseAdmin
    .from("user_usage")
    .upsert(
      {
        user_id: userId,
        month,
        itineraries: usageRow?.itineraries ?? 0,
        plan,
      },
      { onConflict: "user_id,month" }
    );

  if (usageUpsertError) {
    console.error("Usage upsert error:", usageUpsertError);
    throw new Error(usageUpsertError.message);
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Stripe webhook route is ready",
  });
}

export async function POST(req: Request) {
  console.log("=== WEBHOOK HIT ===");

  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Invalid webhook signature";

    console.error("Webhook signature error:", message);

    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("Webhook fired: checkout.session.completed");
        console.log("session.id:", session.id);

        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items.data.price"],
        });

        console.log("FULL session metadata:", fullSession.metadata);
        console.log(
          "FULL session client_reference_id:",
          fullSession.client_reference_id
        );

        const clerkUserId =
          fullSession.metadata?.clerkUserId ??
          fullSession.client_reference_id ??
          null;

        console.log("clerkUserId:", clerkUserId);

        if (!clerkUserId) {
          console.error("Missing clerk user id in checkout session");
          break;
        }

        const resolvedPriceId =
          fullSession.line_items?.data?.[0]?.price?.id ?? null;

        const plan = getPlanFromPriceId(resolvedPriceId);

        console.log("resolvedPriceId:", resolvedPriceId);
        console.log("resolvedPlan:", plan);

        const stripeCustomerId =
          typeof fullSession.customer === "string"
            ? fullSession.customer
            : fullSession.customer?.id ?? null;

        const stripeSubscriptionId =
          typeof fullSession.subscription === "string"
            ? fullSession.subscription
            : fullSession.subscription?.id ?? null;

        console.log("About to upsert profile", {
          clerkUserId,
          plan,
          stripeCustomerId,
          stripeSubscriptionId,
          resolvedPriceId,
        });

        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              user_id: clerkUserId,
              plan,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              stripe_price_id: resolvedPriceId,
              subscription_status: "active",
            },
            { onConflict: "user_id" }
          );

        if (profileError) {
          console.error("Profile upsert error:", profileError);
          throw new Error(profileError.message);
        }

        console.log("Profile upsert success");

        await updateUserPlan(clerkUserId, plan);
        console.log("User plan update success");

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        console.log("Webhook fired: customer.subscription.deleted");
        console.log("subscription.id:", subscription.id);

        const { data, error } = await supabaseAdmin
          .from("profiles")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (error) {
          console.error("Profile lookup error:", error);
          throw new Error(error.message);
        }

        if (data?.user_id) {
          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({
              plan: "free",
              subscription_status: "canceled",
            })
            .eq("user_id", data.user_id);

          if (profileError) {
            console.error("Profile downgrade error:", profileError);
            throw new Error(profileError.message);
          }

          await updateUserPlan(data.user_id, "free");
          console.log("User downgraded to free:", data.user_id);
        } else {
          console.error(
            "Could not resolve clerk user id for deleted subscription",
            subscription.id
          );
        }

        break;
      }

case "customer.subscription.updated": {
  const subscription = event.data.object as Stripe.Subscription;

  console.log("Webhook fired: customer.subscription.updated");
  console.log("subscription.id:", subscription.id);

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const plan = getPlanFromPriceId(priceId);

  console.log("Updated subscription priceId:", priceId);
  console.log("Updated plan:", plan);

  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (error) {
    console.error("Profile lookup error:", error);
    break;
  }

  if (data?.user_id) {
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        plan,
        stripe_price_id: priceId,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
      })
      .eq("user_id", data.user_id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      throw new Error(updateError.message);
    }

    await updateUserPlan(data.user_id, plan);
    console.log("Subscription updated to:", plan);
  }

  break;
}

      default:
        console.log("Unhandled Stripe event:", event.type);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Webhook handler failed";

    console.error("Webhook handler error:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}