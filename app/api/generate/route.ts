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
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  days: number;
  people: PeopleType;
  budget: BudgetType;
  startDate?: string;
  arrivalTime?: string;
  departTime?: string;
  childAges?: ChildAges;
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

type StopWithTime = {
  time?: string;
  title?: string;
  area?: string | null;
  notes?: string | null;
  mapQuery?: string;
  costEstimate?: number;
  [k: string]: unknown;
};

type StopWithInternalTime = StopWithTime & {
  _t?: number | null;
};

type ParsedAiItinerary = {
  itinerary?: Array<{
    day?: number;
    date?: string | null;
    theme?: string;
    stops?: Array<{
      time?: string;
      title?: string;
      area?: string | null;
      notes?: string | null;
      mapQuery?: string;
      costEstimate?: number;
    }>;
    dailyCostEstimate?: number;
  }>;
};

type SafeRequest = Required<
  Omit<
    GenerateRequest,
    "startDate" | "arrivalTime" | "departTime" | "city" | "country" | "lat" | "lng"
  >
> & {
  startDate?: string;
  arrivalTime?: string;
  departTime?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
};

type ChunkResult = NonNullable<ParsedAiItinerary["itinerary"]>;

/** ---------- Helpers ---------- */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function addDays(dateStr: string, add: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + add);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function isValidDateString(dateStr?: string) {
  if (!dateStr) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
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

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function getStopsForPace(pace: Pace) {
  if (pace === "relaxed") return 4;
  if (pace === "packed") return 6;
  return 5;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function extractJson(raw: string) {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  if (first === -1 || last === -1 || last < first) {
    throw new Error("No JSON found in model response");
  }

  return cleaned.slice(first, last + 1);
}

function normalizeKey(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

  if (minStartM !== null) {
    filtered = filtered.filter((s) => s._t == null || s._t >= minStartM);
  }

  if (maxEndM !== null) {
    filtered = filtered.filter((s) => s._t == null || s._t <= maxEndM);
  }

  const n = filtered.length;
  if (n === 0) return [];

  const start = minStartM ?? toMinutes("09:00")!;
  const end = maxEndM ?? toMinutes("19:00")!;
  const safeStart = Math.min(start, end - 30);
  const safeEnd = Math.max(end, safeStart + 30);

  if (n === 1) {
    const { _t, ...rest } = filtered[0];
    return [{ ...rest, time: fmtMinutes(safeStart) }];
  }

  const step = Math.max(30, Math.floor((safeEnd - safeStart) / (n - 1)));

  return filtered.map((s, i) => {
    const { _t, ...rest } = s;
    return {
      ...rest,
      time: fmtMinutes(safeStart + step * i),
    };
  });
}

function dedupeStopsWithinDay(stops: ItineraryStop[], destination: string) {
  const seen = new Set<string>();
  const out: ItineraryStop[] = [];

  for (const stop of stops) {
    const titleKey = normalizeKey(stop.title);
    const areaKey = normalizeKey(stop.area);
    const mapKey = normalizeKey(stop.mapQuery);
    const dedupeKey = [titleKey, areaKey || mapKey].filter(Boolean).join("|");

    if (!dedupeKey) continue;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    out.push({
      ...stop,
      mapQuery: stop.mapQuery?.trim()
        ? stop.mapQuery
        : `${stop.title}, ${destination}`,
    });
  }

  return out;
}

function ensureMinimumStops(
  cleanedStops: ItineraryStop[],
  originalStops: ItineraryStop[],
  minStops: number
) {
  if (cleanedStops.length >= minStops) return cleanedStops;

  const seen = new Set(
    cleanedStops.map((s) => `${normalizeKey(s.title)}|${normalizeKey(s.area)}`)
  );

  const topUp = [...cleanedStops];

  for (const stop of originalStops) {
    const key = `${normalizeKey(stop.title)}|${normalizeKey(stop.area)}`;
    if (seen.has(key)) continue;
    topUp.push(stop);
    seen.add(key);
    if (topUp.length >= minStops) break;
  }

  return topUp;
}

async function logToGoogleSheets(payload: unknown) {
  const url = process.env.GSHEETS_WEBAPP_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // ignore logging failures
  }
}

async function incrementUsage(userId: string, plan: string) {
  const supabase = createSupabaseServerClient();
  const month = new Date().toISOString().slice(0, 7);

  const { data: existing, error: readError } = await supabase
    .from("user_usage")
    .select("itineraries")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (readError) {
    console.error("Usage read error:", readError);
    return;
  }

  const nextCount = (existing?.itineraries ?? 0) + 1;

  const { error: upsertError } = await supabase.from("user_usage").upsert(
    {
      user_id: userId,
      month,
      plan,
      itineraries: nextCount,
    },
    { onConflict: "user_id,month" }
  );

  if (upsertError) {
    console.error("Usage increment error:", upsertError);
  }
}

/** ---------- OpenAI ---------- */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GPT5_SCHEMA_PROMPT = `
Return valid JSON only.
Do not include markdown.
Do not include code fences.
Do not include explanations.
Do not include text before or after the JSON.

Return exactly this object shape:

{
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "string",
      "stops": [
        {
          "time": "09:00",
          "title": "string",
          "area": "string",
          "notes": "string",
          "mapQuery": "string",
          "costEstimate": 0
        }
      ],
      "dailyCostEstimate": 0
    }
  ]
}

Rules:
- Top-level must be an object.
- The object must contain only the key "itinerary".
- itinerary must be an array.
- dailyCostEstimate must equal the sum of costEstimate values.
- Keep notes short and useful.
- area should be short.
- mapQuery should be concise.
`;

async function callModel(params: {
  prompt: string;
  maxTokens: number;
}): Promise<ParsedAiItinerary> {
const completion = await openai.chat.completions.create({
  model: "gpt-5-mini",
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: GPT5_SCHEMA_PROMPT },
    { role: "user", content: params.prompt },
  ],
 
  max_completion_tokens: params.maxTokens,
});

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  const jsonText = extractJson(text);
  return JSON.parse(jsonText) as ParsedAiItinerary;
}

function buildDestinationContext(safe: SafeRequest) {
  return [
    `Destination: ${safe.destination}`,
    `City: ${safe.city ?? "not provided"}`,
    `Country: ${safe.country ?? "not provided"}`,
    `Latitude: ${typeof safe.lat === "number" ? safe.lat : "not provided"}`,
    `Longitude: ${typeof safe.lng === "number" ? safe.lng : "not provided"}`,
  ].join("\n");
}

function buildChunkPrompt(params: {
  safe: SafeRequest;
  chunkIndex: number;
  chunkCount: number;
  chunkDays: number;
  chunkDates: string[];
  stopsPerDay: number;
  usedTitles: string[];
  usedAreas: string[];
}) {
  const { safe, chunkIndex, chunkCount, chunkDays, chunkDates, stopsPerDay, usedTitles, usedAreas } =
    params;

  const interestsText =
    safe.interests.length > 0 ? safe.interests.join(", ") : "general highlights";

  const isFirstChunk = chunkIndex === 0;
  const isLastChunk = chunkIndex === chunkCount - 1;

  return `
Create a ${chunkDays}-day itinerary for part ${chunkIndex + 1} of ${chunkCount}.

${buildDestinationContext(safe)}
People: ${safe.people}
Budget: ${safe.budget}
Pace: ${safe.pace}
Interests: ${interestsText}
Dates: ${chunkDates.length ? chunkDates.join(", ") : "flexible"}
Stops per day: ${stopsPerDay}

Arrival time: ${isFirstChunk ? safe.arrivalTime ?? "not provided" : "not relevant"}
Departure time: ${isLastChunk ? safe.departTime ?? "not provided" : "not relevant"}
Kids age group: ${safe.childAges}

Already used stop titles in earlier chunks:
${usedTitles.length ? usedTitles.join(" | ") : "none"}

Already used areas in earlier chunks:
${usedAreas.length ? usedAreas.join(" | ") : "none"}

Strict rules:
- Return JSON ONLY matching the schema exactly.
- Provide exactly ${stopsPerDay} stops per day.
- Day numbering inside this chunk must start from 1 and increase by 1.
- Use the destination exactly as provided. Do not switch to another city or country unless it is a clearly sensible nearby day trip.
- Use attractive, recognisable, worthwhile places and activities.
- Avoid generic filler like "local museum", "market", "park", or "shopping street" unless it is a specifically named and worthwhile venue.
- Do NOT repeat the same attraction, museum, market, lookout, beach, harbour, bridge walk, food market, or neighbourhood across days.
- Do NOT repeat the same venue from earlier chunks.
- Each day must feel clearly different from the others.
- For full sightseeing days, include a mix of morning, afternoon, and evening stops.
- Only make Day 1 lighter if arrivalTime is provided.
- Only make the final day lighter if departTime is provided.
- Middle days should feel like full days, not dinner-only or night-only plans.
- Make it map-friendly: cluster places each day to reduce backtracking.
- Prefer named, attractive, high-interest stops over vague categories.
- If kids age group is baby/toddler/kids: stroller-friendly, shorter travel hops, include breaks, early dinner, avoid late-night activities.
- Include at least 1 kid-appropriate stop per day when kids age group != none.
- Keep notes short.

Special city guidance:
- If the destination is Sydney, spread days across clearly different areas such as Circular Quay/The Rocks, Darling Harbour, Bondi/Eastern Beaches, Manly/Northern Beaches, Surry Hills/City, Inner West/Newtown, and sensible nearby day trips.
- If the destination is a major city, spread days across distinct neighborhoods and iconic nearby areas.
`.trim();
}

async function generateChunk(params: {
  safe: SafeRequest;
  chunkIndex: number;
  chunkCount: number;
  chunkDays: number;
  chunkDates: string[];
  stopsPerDay: number;
  usedTitles: string[];
  usedAreas: string[];
}): Promise<ChunkResult> {
  const prompt = buildChunkPrompt(params);

  const parsed = await callModel({
    prompt,
    maxTokens: 2200,
  });

  const chunk = Array.isArray(parsed.itinerary)
    ? parsed.itinerary.slice(0, params.chunkDays)
    : [];

  if (chunk.length === 0) {
    throw new Error(`Chunk ${params.chunkIndex + 1} returned no days`);
  }

  return chunk;
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServerClient();

    const usage = await checkUsage(userId);

    if (!usage.allowed) {
      const limitLabel =
        usage.limit === Infinity ? "unlimited" : String(usage.limit);

      return NextResponse.json(
        {
          error: `You have reached your monthly limit of ${limitLabel} itineraries on the ${usage.plan} plan.`,
        },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Partial<GenerateRequest>;

    const safe: SafeRequest = {
      destination: String(body.destination ?? "").trim(),
      city: body.city ? String(body.city).trim() : undefined,
      country: body.country ? String(body.country).trim() : undefined,
      lat: typeof body.lat === "number" ? body.lat : undefined,
      lng: typeof body.lng === "number" ? body.lng : undefined,
      days: clamp(Number(body.days ?? 3), 1, 14),
      people: (body.people ?? "solo") as PeopleType,
      budget: (body.budget ?? "mid") as BudgetType,
      startDate: body.startDate ? String(body.startDate) : undefined,
      arrivalTime: body.arrivalTime ? String(body.arrivalTime) : undefined,
      departTime: body.departTime ? String(body.departTime) : undefined,
      childAges: (body.childAges ?? "none") as ChildAges,
      pace: (body.pace ?? "balanced") as Pace,
      interests: sanitizeStringArray(body.interests),
    };

    if (!safe.destination) {
      return NextResponse.json(
        { error: "Destination is required" },
        { status: 400 }
      );
    }

    if (safe.startDate && !isValidDateString(safe.startDate)) {
      return NextResponse.json(
        { error: "startDate must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    if (safe.arrivalTime && toMinutes(safe.arrivalTime) === null) {
      return NextResponse.json(
        { error: "arrivalTime must be in HH:MM format" },
        { status: 400 }
      );
    }

    if (safe.departTime && toMinutes(safe.departTime) === null) {
      return NextResponse.json(
        { error: "departTime must be in HH:MM format" },
        { status: 400 }
      );
    }

    const dates = safe.startDate
      ? Array.from({ length: safe.days }, (_, i) => addDays(safe.startDate!, i))
      : [];

    const stopsPerDay = getStopsForPace(safe.pace);
    const chunkSize = 3;
    const dateChunks = dates.length > 0 ? chunkArray(dates, chunkSize) : [];
    const chunkCount =
      dates.length > 0 ? dateChunks.length : Math.ceil(safe.days / chunkSize);

    const resolvedChunks: Array<{
      chunkIndex: number;
      chunkDates: string[];
      chunkDays: number;
      chunk: ChunkResult;
    }> = [];

    const usedTitles: string[] = [];
    const usedAreas: string[] = [];

    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
      const chunkDates = dates.length > 0 ? dateChunks[chunkIndex] : [];
      const chunkDays =
        chunkDates.length > 0
          ? chunkDates.length
          : Math.min(chunkSize, safe.days - chunkIndex * chunkSize);

      const chunk = await generateChunk({
        safe,
        chunkIndex,
        chunkCount,
        chunkDays,
        chunkDates,
        stopsPerDay,
        usedTitles: [...usedTitles],
        usedAreas: [...usedAreas],
      });

      // Update memory of used titles/areas for the next chunk
      for (const day of chunk) {
        if (Array.isArray(day.stops)) {
          for (const stop of day.stops) {
            if (typeof stop.title === "string" && stop.title.trim()) {
              usedTitles.push(stop.title.trim());
            }
            if (typeof stop.area === "string" && stop.area.trim()) {
              usedAreas.push(stop.area.trim());
            }
          }
        }
      }

      resolvedChunks.push({
        chunkIndex,
        chunkDates,
        chunkDays,
        chunk,
      });
    }

    resolvedChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    const allGeneratedDays: NonNullable<ParsedAiItinerary["itinerary"]> = [];
    let globalDayNumber = 1;

    for (const resolved of resolvedChunks) {
      const chunkItinerary = resolved.chunk.slice(0, resolved.chunkDays);

      for (let i = 0; i < chunkItinerary.length; i++) {
        const item = chunkItinerary[i];
        allGeneratedDays.push({
          ...item,
          day: globalDayNumber,
          date:
            resolved.chunkDates[i] ??
            (safe.startDate ? addDays(safe.startDate, globalDayNumber - 1) : null),
        });
        globalDayNumber += 1;
      }
    }

    const itinerary: ItineraryDay[] = allGeneratedDays
      .slice(0, safe.days)
      .map((d, idx) => {
        const rawStops = Array.isArray(d.stops) ? (d.stops as StopWithTime[]) : [];

        const isDay1 = idx === 0;
        const isLastDay = idx === safe.days - 1;

        const fixedStops = enforceDayTimeRules(rawStops, {
          minStart: isDay1 ? safe.arrivalTime ?? null : null,
          maxEnd: isLastDay ? safe.departTime ?? null : null,
        });

        const normalizedStops: ItineraryStop[] = fixedStops.map((s) => ({
          time: typeof s.time === "string" ? s.time : "09:00",
          title: typeof s.title === "string" ? s.title : "Stop",
          area: typeof s.area === "string" ? s.area : undefined,
          notes: typeof s.notes === "string" ? s.notes : undefined,
          mapQuery:
            typeof s.mapQuery === "string" && s.mapQuery.trim()
              ? s.mapQuery
              : `${typeof s.title === "string" ? s.title : "Attraction"}, ${safe.destination}`,
          costEstimate: Number(s.costEstimate) || 0,
        }));

        const dedupedStops = dedupeStopsWithinDay(normalizedStops, safe.destination);

        const minStopsForDay =
          isDay1 || isLastDay ? Math.max(2, stopsPerDay - 1) : stopsPerDay;

        const cleanedStops = ensureMinimumStops(
          dedupedStops,
          normalizedStops,
          minStopsForDay
        );

        const dailyCostEstimate = cleanedStops.reduce(
          (sum, stop) => sum + stop.costEstimate,
          0
        );

        return {
          day: idx + 1,
          date: safe.startDate ? addDays(safe.startDate, idx) : undefined,
          theme: d.theme || `Day ${idx + 1}`,
          stops: cleanedStops,
          dailyCostEstimate,
        };
      });

    const responseBody = {
      input: safe,
      itinerary,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "openai",
        model: "chunked:gpt-5-mini",
      },
    };

    const tripTitle = `${safe.days}-day ${safe.destination} (${safe.budget})`;

    const baseSlug = makeTripSlug({
      destination: safe.destination,
      days: safe.days,
      budget: safe.budget,
      people: safe.people,
    });

    let slug = baseSlug;

    const { data: existingSlug } = await supabase
      .from("itineraries")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug?.slug) {
      slug = addSlugSuffix(baseSlug, Date.now().toString().slice(-6));
    }

    const { data: savedTrip, error: saveError } = await supabase
      .from("itineraries")
      .insert([
        {
          user_id: userId,
          slug,
          title: tripTitle,
          destination: safe.destination,
          start_date: safe.startDate ?? null,
          end_date: safe.startDate
            ? addDays(safe.startDate, safe.days - 1)
            : null,
          budget: safe.budget,
          interests: safe.interests,
          travellers:
            safe.people === "solo" ? 1 : safe.people === "couple" ? 2 : 4,
          raw_prompt: JSON.stringify(safe),
          generated_plan: responseBody,
        },
      ])
      .select("id, slug, title, destination, created_at")
      .single();

    if (saveError) {
      console.error("Supabase save error:", saveError);
      return NextResponse.json(
        { error: "Itinerary generated but failed to save" },
        { status: 500 }
      );
    }

    await incrementUsage(userId, usage.plan);

    await logToGoogleSheets({
      type: "itinerary",
      destination: safe.destination,
      city: safe.city ?? "",
      country: safe.country ?? "",
      days: safe.days,
      people: safe.people,
      budget: safe.budget,
      pace: safe.pace,
      startDate: safe.startDate ?? "",
      arrivalTime: safe.arrivalTime ?? "",
      departTime: safe.departTime ?? "",
      childAges: safe.childAges ?? "none",
      interests: safe.interests,
      source: "generate_api_openai_gpt5_chunked",
      savedTripId: savedTrip.id,
      clerkUserId: userId,
      plan: usage.plan,
      monthlyCount: usage.used + 1,
      monthlyLimit: usage.limit === Infinity ? "unlimited" : usage.limit,
    });

    return NextResponse.json({
      ...responseBody,
      savedTrip,
      usage: {
        plan: usage.plan,
        used: usage.used + 1,
        limit: usage.limit === Infinity ? "unlimited" : usage.limit,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("Generate route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
