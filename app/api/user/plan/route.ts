import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ plan: "free" });
    }

    const supabase = createSupabaseServerClient();

    const { data } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .maybeSingle();

    return NextResponse.json({
      plan: data?.plan ?? "free",
    });
  } catch {
    return NextResponse.json({ plan: "free" });
  }
}