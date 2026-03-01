// app/api/generate/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

/** ---------- Types ---------- */
type PeopleType = "solo" | "couple" | "family";
type Pace = "relaxed" | "balanced" | "packed";
type ChildAges = "none" | "baby" | "toddler" | "kids" | "teens";

type GenerateRequest = {
  destination: string;
  days: number;
  people: PeopleType;
  budget: "budget" | "mid" | "premium";
  startDate?: string;

  arrivalTime?: string; // "HH:MM" local time
  departTime?: string; // "HH:MM" local time
  childAges?: ChildAges; // baby/toddler/kids/teens
  pace?: Pace;
  interests?: string[];
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

<<<<<<< HEAD
/** ---------- Helpers ---------- */
=======
>>>>>>> dfc7138 (Fix build and time rules)
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function addDays(dateStr: string, add: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + add);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toMinutes(hhmm?: string) {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function fmtMinutes(mins: number) {
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

<<<<<<< HEAD
/**
 * Enforce time constraints:
 * - Day 1 start >= arrivalTime (if provided)
 * - Last day end <= departTime (if provided)
 * - If times are missing/invalid, we re-time stops to fit nicely in window
 *
 * IMPORTANT: no `delete` used (fixes Vercel TypeScript error).
 */
type StopWithTime = { time?: string; [k: string]: any };
type StopWithInternalTime = StopWithTime & { _t: number | null };
=======
// ensure times are non-decreasing and within constraints
type StopWithTime = Record<string, unknown> & { time?: string };
>>>>>>> dfc7138 (Fix build and time rules)

function enforceDayTimeRules(
  stops: StopWithTime[],
  opts: { minStart?: string | null; maxEnd?: string | null }
): StopWithTime[] {
  const minStartM = toMinutes(opts.minStart ?? undefined);
  const maxEndM = toMinutes(opts.maxEnd ?? undefined);

  const parsed: StopWithInternalTime[] = stops.map((s) => ({
    ...s,
    _t: toMinutes(typeof s.time === "string" ? s.time : undefined),
  }));

  let filtered = parsed;

  // Remove stops before arrival
  if (minStartM !== null) {
    filtered = filtered.filter((s) => s._t == null || s._t >= minStartM);
  }

  // Remove stops after departure
  if (maxEndM !== null) {
    filtered = filtered.filter((s) => s._t == null || s._t <= maxEndM);
  }

  const n = filtered.length;
  if (n === 0) return [];

  const start = minStartM ?? toMinutes("09:00")!;
  const end = maxEndM ?? toMinutes("19:00")!;
  const safeStart = Math.min(start, end - 30);
  const safeEnd = Math.max(end, safeStart + 30);

  // ✅ Single stop
  if (n === 1) {
    const { _t, ...rest } = filtered[0];
    return [{ ...rest, time: fmtMinutes(safeStart) }];
  }

  // ✅ Multiple stops — evenly spread
  const step = Math.max(30, Math.floor((safeEnd - safeStart) / (n - 1)));

  return filtered.map((s, i) => {
    const { _t, ...rest } = s;
    return {
      ...rest,
      time: fmtMinutes(safeStart + step * i),
    };
  });
}

<<<<<<< HEAD
/** ---------- Optional logging ---------- */
async function logToGoogleSheets(payload: any) {
=======
async function logToGoogleSheets(payload: unknown) {
>>>>>>> dfc7138 (Fix build and time rules)
  const url = process.env.GSHEETS_WEBAPP_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
<<<<<<< HEAD
    // ignore
=======
    // ignore logging errors
>>>>>>> dfc7138 (Fix build and time rules)
  }
}

/** ---------- OpenAI ---------- */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SCHEMA_PROMPT = `
Return JSON ONLY. No markdown. No code fences. No explanations. No extra text.

{
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD" | null,
      "theme": "string",
      "stops": [
        {
          "time": "09:00",
          "title": "string",
          "area": "string" | null,
          "notes": "string" | null,
          "mapQuery": "string",
          "costEstimate": number
        }
      ],
      "dailyCostEstimate": number
    }
  ]
}

Rules:
- stops length must be 4–6 based on pace (relaxed=4, balanced=5, packed=6).
- time should be realistic (e.g. 09:00, 10:30, 12:00, 14:00, 16:30, 19:00).
- dailyCostEstimate must equal sum(costEstimate).
`;

/** ---------- Route ---------- */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<GenerateRequest>;

    if (!body.destination || !String(body.destination).trim()) {
<<<<<<< HEAD
      return NextResponse.json({ error: "Destination required" }, { status: 400 });
=======
      return NextResponse.json(
        { error: "Destination required" },
        { status: 400 }
      );
>>>>>>> dfc7138 (Fix build and time rules)
    }

    const safe: GenerateRequest = {
      destination: String(body.destination).trim(),
      days: clamp(Number(body.days ?? 3), 1, 14),
      people: (body.people ?? "solo") as PeopleType,
      budget: (body.budget ?? "mid") as GenerateRequest["budget"],
<<<<<<< HEAD
      startDate: body.startDate ? String(body.startDate) : undefined,

      arrivalTime: body.arrivalTime ? String(body.arrivalTime) : undefined,
      departTime: body.departTime ? String(body.departTime) : undefined,
=======
      startDate: body.startDate,

      arrivalTime: body.arrivalTime,
      departTime: body.departTime,
>>>>>>> dfc7138 (Fix build and time rules)
      childAges: (body.childAges ?? "none") as ChildAges,

      pace: (body.pace ?? "balanced") as Pace,
      interests: Array.isArray(body.interests) ? body.interests : [],
    };

    const dates = safe.startDate
      ? Array.from({ length: safe.days }).map((_, i) => addDays(safe.startDate!, i))
      : [];

    const userPrompt = `
Create a ${safe.days}-day itinerary.

Destination: ${safe.destination}
People: ${safe.people}
Budget: ${safe.budget}
Pace: ${safe.pace}
Interests: ${(safe.interests ?? []).join(", ") || "general highlights"}
Dates: ${dates.length ? dates.join(", ") : "flexible"}

Arrival time: ${safe.arrivalTime ?? "not provided"}
Departure time: ${safe.departTime ?? "not provided"}
Kids age group: ${safe.childAges ?? "none"}

Constraints:
- Return JSON ONLY matching the schema exactly. No extra keys.
- Provide 4–6 stops depending on pace (relaxed=4, balanced=5, packed=6).
- If arrivalTime is provided, Day 1 must start AFTER that time.
- If departTime is provided, last day must end BEFORE that time.
- If kids age group is baby/toddler/kids: stroller-friendly, shorter travel hops, include breaks, early dinner, avoid late-night activities.
- Include at least 1 kid-appropriate stop per day when kids age group != none.
- Make it map-friendly: cluster areas each day to reduce backtracking.
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: SCHEMA_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "AI returned non-JSON", raw: text }, { status: 502 });
    }

    const itinerary: ItineraryDay[] = (parsed.itinerary ?? [])
      .slice(0, safe.days)
      .map((d: any, idx: number) => {
<<<<<<< HEAD
        const rawStops = Array.isArray(d.stops) ? d.stops : [];
=======
        const rawStops: StopWithTime[] = Array.isArray(d?.stops) ? d.stops : [];
>>>>>>> dfc7138 (Fix build and time rules)

        const isDay1 = idx === 0;
        const isLastDay = idx === safe.days - 1;

        const fixedStops = enforceDayTimeRules(rawStops, {
          minStart: isDay1 ? safe.arrivalTime ?? null : null,
          maxEnd: isLastDay ? safe.departTime ?? null : null,
        });

        const dailyCostEstimate =
<<<<<<< HEAD
          typeof d.dailyCostEstimate === "number"
            ? d.dailyCostEstimate
            : fixedStops.reduce((sum, s: any) => sum + (Number(s.costEstimate) || 0), 0);
=======
          typeof d?.dailyCostEstimate === "number"
            ? d.dailyCostEstimate
            : fixedStops.reduce(
                (sum: number, s: any) => sum + (Number(s.costEstimate) || 0),
                0
              );
>>>>>>> dfc7138 (Fix build and time rules)

        return {
          day: idx + 1,
          date: safe.startDate ? addDays(safe.startDate, idx) : undefined,
<<<<<<< HEAD
          theme: d.theme || `Day ${idx + 1}`,
=======
          theme: d?.theme || `Day ${idx + 1}`,
>>>>>>> dfc7138 (Fix build and time rules)
          stops: fixedStops.map((s: any) => ({
            time: s.time || "09:00",
            title: s.title || "Stop",
            area: s.area ?? undefined,
            notes: s.notes ?? undefined,
            mapQuery: s.mapQuery || `${s.title || "Attraction"}, ${safe.destination}`,
            costEstimate: Number(s.costEstimate) || 0,
          })),
          dailyCostEstimate,
        };
      });

    const responseBody = {
      input: safe,
      itinerary,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "openai",
        model: "gpt-5-mini",
      },
    };

<<<<<<< HEAD
    // non-blocking logging (optional)
=======
    // async logging (non-blocking)
>>>>>>> dfc7138 (Fix build and time rules)
    logToGoogleSheets({
      type: "itinerary",
      destination: safe.destination,
      days: safe.days,
      people: safe.people,
      budget: safe.budget,
      pace: safe.pace,
      startDate: safe.startDate ?? "",
      arrivalTime: safe.arrivalTime ?? "",
      departTime: safe.departTime ?? "",
      childAges: safe.childAges ?? "none",
      interests: safe.interests ?? [],
      source: "generate_api_openai",
    });

    return NextResponse.json(responseBody);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
