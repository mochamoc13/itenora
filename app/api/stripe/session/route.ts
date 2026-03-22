import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price", "subscription"],
    });

    const priceId = session.line_items?.data?.[0]?.price?.id ?? null;

    let plan = "free";
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID) {
      plan = "plus";
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
      plan = "pro";
    }

    return NextResponse.json({
      success:
        session.payment_status === "paid" || session.status === "complete",
      customerEmail: session.customer_details?.email ?? null,
      plan,
      sessionId: session.id,
      subscriptionId:
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to verify session";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}