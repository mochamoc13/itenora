import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkUsage } from "@/lib/usage";
import { makeTripSlug, addSlugSuffix } from "@/lib/slug";

/** ---------- Types ---------- */
type PeopleType = "solo" | "couple" | "family";
type Pace = "relaxed" | "balanced" | "packed";
type ChildAges = "none" | "baby" | "toddler" | "kids" | "teens";
type BudgetType = "budget" | "mid" | "premium";

type GenerateRequest = {
  destination: string;
  days: number;
  people: PeopleType;
  budget: BudgetType;
  startDate?: string;
  arrivalTime?: string;
  departTime?: string;
  childAges?: ChildAges;
  pace?: Pace;
  interests: string[]; // ✅ FIXED
};

type ItineraryStop = {
  time: string;
  title: string;
  area?: string;
  notes?: string;
  mapQuery: string;
  costEstimate: number;
};

type ItineraryDay = {
  day: number;
  date?: string;
  theme: string;
  stops: ItineraryStop[];
  dailyCostEstimate: number;
};

type StopWithTime = { time?: string; [k: string]: unknown };
type StopWithInternalTime = StopWithTime & { _t?: number | null };

type ParsedAiItinerary = {
  itinerary?: any[];
};

/** ---------- Helpers ---------- */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function addDays(dateStr: string, add: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + add);
  return d.toISOString().slice(0, 10);
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

/** ---------- OpenAI ---------- */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServerClient();
    const usage = await checkUsage(userId);

    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Monthly limit reached" },
        { status: 429 }
      );
    }

    const body = await req.json();

    const safe: GenerateRequest = {
      destination: String(body.destination ?? ""),
      days: clamp(Number(body.days ?? 3), 1, 14),
      people: body.people ?? "solo",
      budget: body.budget ?? "mid",
      startDate: body.startDate,
      arrivalTime: body.arrivalTime,
      departTime: body.departTime,
      childAges: body.childAges ?? "none",
      pace: body.pace ?? "balanced",
      interests: sanitizeStringArray(body.interests), // always array
    };

    const userPrompt = `
Create a ${safe.days}-day itinerary.

Destination: ${safe.destination}
People: ${safe.people}
Budget: ${safe.budget}
Pace: ${safe.pace}
Interests: ${safe.interests.length ? safe.interests.join(", ") : "general highlights"}

`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = completion.choices[0]?.message?.content ?? "{}";

    let parsed: ParsedAiItinerary;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "AI error" }, { status: 500 });
    }

    const itinerary = parsed.itinerary ?? [];

    return NextResponse.json({
      itinerary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}