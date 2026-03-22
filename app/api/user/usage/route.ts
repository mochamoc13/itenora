import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkUsage } from "@/lib/usage";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        plan: "free",
        used: 0,
        limit: 2,
      });
    }

    const usage = await checkUsage(userId);

    return NextResponse.json({
      plan: usage.plan,
      used: usage.used,
      limit: usage.limit === Infinity ? "unlimited" : usage.limit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load usage";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}