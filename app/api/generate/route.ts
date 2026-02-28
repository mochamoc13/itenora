// app/api/generate/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

type PeopleType = "solo" | "couple" | "family";
type Pace = "relaxed" | "balanced" | "packed";
type ChildAges = "none" | "baby" | "toddler" | "kids" | "teens";

type GenerateRequest = {
  destination: string;
  days: number;
  people: PeopleType;
  budget: "budget" | "mid" | "premium";
  startDate?: string;

  // ✅ NEW
  arrivalTime?: string;   // "HH:MM" local time
  departTime?: string;    // "HH:MM" local time
  childAges?: ChildAges;  // baby/toddler/kids/teens
  pace?: Pace;
  interests?: string[];
};

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

// ensure times are non-decreasing and within constraints
type StopWithTime = { time?: string; [k: string]: any };

function enforceDayTimeRules(
  stops: StopWithTime[],
  opts: { minStart?: string | null; maxEnd?: string | null }
) {
  const minStartM = toMinutes(opts.minStart ?? undefined);
  const maxEndM = toMinutes(opts.maxEnd ?? undefined);

  // add _t as an internal field (no delete needed later)
  const parsed = stops.map((s) => ({
    ...s,
    _t: toMinutes(s.time),
  }));

  // 1) Drop anything before arrival
  let filtered = parsed;
  if (minStartM !== null) {
    filtered = filtered.filter((s) => s._t === null || s._t >= minStartM);
  }

  // 2) Drop anything after departure
  if (maxEndM !== null) {
    filtered = filtered.filter((s) => s._t === null || s._t <= maxEndM);
  }

  const n = filtered.length;
  if (n === 0) return [];

  const start = minStartM ?? toMinutes("09:00")!;
  const end = maxEndM ?? toMinutes("19:00")!;
  const safeStart = Math.min(start, end - 30);
  const safeEnd = Math.max(end, safeStart + 30);

  // If only 1 stop, put it at start
  if (n === 1) {
    filtered[0].time = fmtMinutes(safeStart);
    const { _t, ...rest } = filtered[0];
    return [rest];
  }

  const step = Math.max(30, Math.floor((safeEnd - safeStart) / (n - 1)));

  return filtered.map((s, i) => {
    const t = fmtMinutes(safeStart + step * i);
    const { _t, ...rest } = s;
    return { ...rest, time: t };
  });
}
async function logToGoogleSheets(payload: any) {
  const url = process.env.GSHEETS_WEBAPP_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {}
}

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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateRequest;

    if (!body.destination) {
      return NextResponse.json(
        { error: "Destination required" },
        { status: 400 }
      );
    }

 const safe: GenerateRequest = {
  destination: body.destination.trim(),
  days: clamp(Number(body.days ?? 3), 1, 14),
  people: (body.people ?? "solo") as PeopleType,
  budget: (body.budget ?? "mid") as GenerateRequest["budget"],
  startDate: body.startDate,

  // ✅ NEW
  arrivalTime: body.arrivalTime,
  departTime: body.departTime,
  childAges: (body.childAges ?? "none") as any,

  pace: body.pace ?? "balanced",
  interests: Array.isArray(body.interests) ? body.interests : [],
};

    const dates = safe.startDate
      ? Array.from({ length: safe.days }).map((_, i) =>
          addDays(safe.startDate!, i)
        )
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
- If arrivalTime is provided, Day 1 must start AFTER that time (no 09:00 start if arriving at 15:00).
- If departTime is provided, last day must end BEFORE that time (no late activities).
- If kids age group is baby/toddler/kids: stroller-friendly, shorter travel hops, include breaks, early dinner, avoid late-night activities.
- Include at least 1 kid-appropriate stop per day when kids age group != none.
- Make it map-friendly: cluster areas each day to reduce backtracking.
`;

    // ✅ GPT-5 mini (current model)
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
      return NextResponse.json(
        { error: "AI returned non-JSON", raw: text },
        { status: 502 }
      );
    }

    const itinerary: ItineraryDay[] = (parsed.itinerary ?? []).slice(0, safe.days).map((d, idx) => {
  const rawStops = Array.isArray(d.stops) ? d.stops : [];

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

  // ✅ Enforce time rules:
  const isDay1 = idx === 0;
  const isLastDay = idx === safe.days - 1;

  const fixedStops = enforceDayTimeRules(rawStops, {
    minStart: isDay1 ? safe.arrivalTime ?? null : null,
    maxEnd: isLastDay ? safe.departTime ?? null : null,
  });

  const dailyCostEstimate =
    typeof d.dailyCostEstimate === "number"
      ? d.dailyCostEstimate
      : fixedStops.reduce((sum, s) => sum + (Number(s.costEstimate) || 0), 0);

  return {
    day: idx + 1,
    date: safe.startDate ? addDays(safe.startDate, idx) : undefined,
    theme: d.theme || `Day ${idx + 1}`,
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

    // 🔹 async logging (non-blocking)
    logToGoogleSheets({
      type: "itinerary",
      destination: safe.destination,
      days: safe.days,
      people: safe.people,
      budget: safe.budget,
      pace: safe.pace,
      startDate: safe.startDate ?? "",
      interests: safe.interests ?? [],
      source: "generate_api_openai",
    });

    return NextResponse.json(responseBody);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}