import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { makeTripSlug } from "@/lib/slug";

/** ---------- Types ---------- */
type PeopleType = "solo" | "couple" | "family";
type Pace = "relaxed" | "balanced" | "packed";
type ChildAges = "none" | "baby" | "toddler" | "kids" | "teens";
type BudgetType = "budget" | "mid" | "premium";
type AppPlan = "free" | "plus" | "pro";

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
  seoTitle?: string;
  seoDescription?: string;
  h1?: string;
  introParagraph?: string;
  overviewBullets?: string[];
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

type UsageInfo = {
  allowed: boolean;
  plan: AppPlan;
  used: number;
  limit: number;
  periodKey: string;
  periodStart: string | null;
  periodEnd: string | null;
};

type GenerationLockResult =
  | { acquired: true; retryAfterSeconds: 0 }
  | { acquired: false; retryAfterSeconds: number };

type SavedTrip = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  created_at: string;
};

type BlueprintDay = {
  day: number;
  role: string;
  theme: string;
  guidance: string;
};

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

  return Array.from(
    new Set(
      value
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter(Boolean)
    )
  ).slice(0, 12);
}

function sanitizeOverviewBullets(value: unknown, max = 7): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, max);
}

function titleCaseWords(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function buildAudienceLabel(people: PeopleType, childAges: ChildAges) {
  if (people === "family" || childAges !== "none") return "for Families";
  if (people === "couple") return "for Couples";
  return "for Solo Travellers";
}

function buildSeoH1(safe: SafeRequest) {
  const audience = buildAudienceLabel(safe.people, safe.childAges);
  return `${safe.days} Day ${titleCaseWords(safe.destination)} Itinerary ${audience} (2026)`;
}

function buildSeoTitle(safe: SafeRequest) {
  return `${buildSeoH1(safe)} | Itenora`;
}

function buildSeoDescription(safe: SafeRequest) {
  const audience =
    safe.people === "family"
      ? "for families"
      : safe.people === "couple"
        ? "for couples"
        : "for solo travellers";

  const interests =
    safe.interests.length > 0
      ? safe.interests.slice(0, 3).join(", ")
      : "top attractions, food spots, and practical planning tips";

  return `Plan the perfect ${safe.days} day ${safe.destination} itinerary ${audience}. Includes ${interests} with a day-by-day travel plan.`;
}

function buildFallbackIntroParagraph(safe: SafeRequest) {
  const audience =
    safe.people === "family"
      ? "families"
      : safe.people === "couple"
        ? "couples"
        : "solo travellers";

  return `This ${safe.days} day ${safe.destination} itinerary is designed for ${audience} who want a smoother trip with day-by-day suggestions, attractions, food stops, and practical planning ideas.`;
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

function parseSupabaseDate(value?: string | null) {
  if (!value) return null;

  let normalized = value.replace(" ", "T");

  if (/([+-]\d{2})$/.test(normalized)) {
    normalized = normalized.replace(/([+-]\d{2})$/, "$1:00");
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function enforceDayTimeRules(
  stops: StopWithTime[],
  opts: { minStart?: string | null; maxEnd?: string | null }
): StopWithTime[] {

  const minStartM = toMinutes(opts.minStart ?? undefined);
  const maxEndM = toMinutes(opts.maxEnd ?? undefined);

  // ✅ ADD THIS BLOCK RIGHT HERE
  const hasFullDayAnchor = stops.some(s =>
    typeof s.title === "string" &&
/(universal|disney|theme park|studio|resort)/i.test(s.title)
  );

  if (hasFullDayAnchor) {
    return stops; // 🚀 DO NOT touch timing
  }

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

function enforceOneWayAreaFlow(stops: ItineraryStop[]) {
  if (stops.length <= 3) return stops;

  let currentArea = stops[0].area;
  let switched = false;

  const result: ItineraryStop[] = [];

  for (const stop of stops) {
    if (!stop.area) {
      result.push(stop);
      continue;
    }

    if (stop.area !== currentArea) {
      if (switched) {
        continue; // prevent bouncing back again
      }

      switched = true;
      currentArea = stop.area;
    }

    result.push(stop);
  }

  // If the filter trims too much, keep the original day
  if (result.length < Math.max(3, stops.length - 2)) {
    return stops;
  }

  return result;
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

function dedupeStopsAcrossTrip(
  stops: ItineraryStop[],
  seenTripStops: Set<string>
): ItineraryStop[] {
  const out: ItineraryStop[] = [];

  for (const stop of stops) {
    const key = `${normalizeKey(stop.title)}|${normalizeKey(stop.area) || normalizeKey(stop.mapQuery)}`;
    if (!key.trim()) continue;
    if (seenTripStops.has(key)) continue;
    seenTripStops.add(key);
    out.push(stop);
  }

  return out;
}

function ensureMinimumStops(
  cleanedStops: ItineraryStop[],
  originalStops: ItineraryStop[],
  minStops: number,
  seenTripStops?: Set<string>
) {
  if (cleanedStops.length >= minStops) return cleanedStops;

  const seen = new Set(
    cleanedStops.map((s) => `${normalizeKey(s.title)}|${normalizeKey(s.area)}`)
  );

  const topUp = [...cleanedStops];

  for (const stop of originalStops) {
    const key = `${normalizeKey(stop.title)}|${normalizeKey(stop.area)}`;
    if (seen.has(key)) continue;

    if (seenTripStops) {
      const globalKey = `${normalizeKey(stop.title)}|${normalizeKey(stop.area) || normalizeKey(stop.mapQuery)}`;
      if (seenTripStops.has(globalKey)) continue;
      seenTripStops.add(globalKey);
    }

    topUp.push(stop);
    seen.add(key);
    if (topUp.length >= minStops) break;
  }

  return topUp;
}

function buildInterestLabel(safe: SafeRequest) {
  return safe.interests.length > 0
    ? safe.interests.join(", ")
    : "general highlights";
}

function hasInterest(safe: SafeRequest, term: string) {
  return safe.interests.some((x) => normalizeKey(x).includes(normalizeKey(term)));
}

function buildDestinationSpecificGuidance(safe: SafeRequest) {
  const d = normalizeKey(safe.destination);
  const city = normalizeKey(safe.city);
  const target = `${d} ${city}`.trim();

  if (target.includes("medan")) {
    return [
      "For Medan, avoid repeating malls and generic restaurants across days.",
      "Spread days across different styles such as heritage/city highlights, local food areas, family-friendly attractions, local neighbourhood life, religious or cultural sites, parks, and easy-access scenic options.",
      "Good Medan variety can include Maimun Palace area, Grand Mosque area, Kesawan heritage zone, Merdeka Walk area, Rahmat International Wildlife Museum, Marian Shrine of Annai Velangkanni, family parks, and strong named culinary areas.",
      "Do not make multiple days feel like 'mall + dinner + market'.",
      "Do NOT use Lake Toba as a same-day Medan city day trip unless the plan starts very early in the morning and the whole day is built around it.",
      "For family trips from Medan, prefer Berastagi-style or within-city/near-city options over Lake Toba as a same-day outing.",
      "Never schedule a Lake Toba departure in the afternoon or evening from Medan.",
    ].join("\n");
  }

if (target.includes("tokyo") || target.includes("japan") || target.includes("osaka") || target.includes("kyoto")) {
  return [
    "For Japan trips, organise days by logical districts and minimise cross-city or cross-district backtracking.",
    "Cluster nearby attractions on the same day and keep adjacent districts together on consecutive days where sensible.",
    "For Osaka specifically, group areas like Osaka Castle / central Osaka, Dotonbori-Namba-Shinsaibashi, Umeda, Bay Area / Aquarium, and Universal Studios Japan logically.",
    "Universal Studios Japan should normally be treated as a full-day attraction, especially for families.",
    "Do not schedule another major attraction after Universal Studios Japan on the same day unless it is only a short evening food or rest stop nearby.",
    "Large aquariums, major zoos, and large museums should be treated as half-day anchors, not quick 1-hour stops.",
    "Do not repeat the same type of shrine-shopping-food day across multiple days.",
  ].join("\n");
}

  if (target.includes("singapore")) {
    return [
      "For Singapore, spread days across Marina Bay, Sentosa, Chinatown/Tiong Bahru, Orchard/Bugis, Gardens by the Bay, zoo or island/reservoir style options, and hawker-focused food experiences.",
      "Do not repeat shopping mall style days.",
    ].join("\n");
  }

if (target.includes("bali")) {
  return [
    "For Bali, organise the itinerary by logical stay zones instead of bouncing across the island.",
    "Cluster nearby days together. If Ubud is used as a base, keep Ubud-area attractions on consecutive days where possible instead of returning there after several days elsewhere.",
    "Typical Bali flow should group areas such as: Uluwatu / South Bali, Seminyak-Canggu, Ubud / central Bali, East Bali, or Nusa Penida as their own sensible zones.",
    "Do not create unnecessary back-and-forth between south Bali and Ubud on separate non-consecutive days unless there is a strong reason.",
    "If 2 days naturally belong in Ubud, place them back-to-back and recommend Ubud accommodation for both days.",
    "Vary days across beach, cliff/coast, rice terrace or nature, temple/culture, cafe or lifestyle zones, family-friendly attractions, and one slower scenic day.",
    "Do not repeat beach club style days.",
    "If the trip starts in south Bali, do not move inland and then return to south Bali later unless the final day is clearly built as a one-way transfer.",
"Recommended hotel areas should stay consistent for consecutive days in the same zone.",
  ].join("\n");
}

  if (target.includes("sydney")) {
    return [
      "For Sydney, spread days across Circular Quay/The Rocks, Darling Harbour, Bondi/Eastern Beaches, Manly/Northern Beaches, Surry Hills/City, Inner West/Newtown, and sensible nearby day trips.",
      "Do not repeat harbour-viewpoint-food days with only minor changes.",
    ].join("\n");
  }

  if (target.includes("melbourne")) {
    return [
      "For Melbourne, spread days across CBD laneways, Southbank/Arts Precinct, Fitzroy/Collingwood, St Kilda/Bayside, markets/food, gardens or river, and one sensible nearby trip.",
      "Do not repeat laneway-cafe-shopping days.",
    ].join("\n");
  }

  if (target.includes("new york")) {
    return [
      "For New York, spread days across Lower Manhattan, Midtown icons, Central Park and museums, Brooklyn, neighbourhood food or culture, skyline or waterfront areas, and one slower local day.",
      "Do not repeat skyscraper-view-shopping-food days.",
    ].join("\n");
  }

  return [
    "If the destination is a major city, spread days across clearly different neighbourhoods, landmark clusters, food zones, scenic areas, and at most one sensible nearby day trip.",
    "If the destination is less famous, create variety by changing the day type: heritage, iconic sights, local culture, family fun, nature/scenic, food-focused, neighbourhood exploration, and lighter wrap-up.",
  ].join("\n");
}

function isLikelyMedanDestination(safe: SafeRequest) {
  const target = `${normalizeKey(safe.destination)} ${normalizeKey(safe.city)}`.trim();
  return target.includes("medan");
}

function getMaxReasonableDayTripHours(safe: SafeRequest) {
  const isFamilyTrip = safe.people === "family" || safe.childAges !== "none";
  if (isFamilyTrip) return 2.5; // one-way practical ceiling
  return 3;
}

function buildDayTripRules(safe: SafeRequest) {
  const maxOneWayHours = getMaxReasonableDayTripHours(safe);

  return [
    `Nearby day trip rule: only include a day trip if one-way travel is realistically about ${maxOneWayHours} hours or less by normal road/ferry conditions.`,
    "Do NOT include a day trip that needs very long highway travel each way unless the trip is explicitly designed as an overnight move.",
    "Do NOT schedule long-distance departures late in the day.",
    "If a place is too far for a comfortable same-day trip, keep it out of the itinerary.",
    "For family trips, be stricter about travel time and avoid exhausting same-day return journeys.",
    "Group nearby districts and nearby attractions into the same day whenever possible.",
    "If multiple days use the same base area, place them on consecutive days where possible instead of returning to that area later in the trip.",
    "Avoid zig-zagging between opposite sides of the destination on different days unless there is a very strong reason.",
    "A major attraction day should not also include another major anchor far away on the same day.",
  ].join("\n");
}


function getRolePool(safe: SafeRequest): Array<{ role: string; theme: string; guidance: string }> {
  const isFamily = safe.people === "family" || safe.childAges !== "none";
  const pool: Array<{ role: string; theme: string; guidance: string }> = [
    {
      role: "iconic-highlights",
      theme: "Iconic highlights",
      guidance:
        "Focus on the destination's best-known must-see places and strongest first-timer attractions.",
    },
    {
      role: "culture-heritage",
      theme: "Culture and heritage",
      guidance:
        "Use heritage areas, architectural icons, museums, temples/churches/mosques, or historically meaningful places.",
    },
    {
      role: "food-local-life",
      theme: "Food and local life",
      guidance:
        "Center the day around strong local eats, markets, street food, and authentic neighbourhood atmosphere.",
    },
    {
      role: "nature-scenic",
      theme: "Nature and scenic spots",
      guidance:
        "Use parks, waterfronts, lookouts, gardens, beaches, hills, lakes, or scenic day-trip style areas.",
    },
    {
      role: "hidden-gems",
      theme: "Hidden gems",
      guidance:
        "Include lesser-known but worthwhile areas that still feel attractive and memorable.",
    },
    {
      role: "shopping-lifestyle",
      theme: "Shopping and lifestyle",
      guidance:
        "Use one strong shopping or lifestyle area plus nearby food, culture, or scenic stops so the day does not feel like only malls.",
    },
    {
      role: "local-neighbourhoods",
      theme: "Neighbourhood exploration",
      guidance:
        "Focus on distinct local districts, street life, cafes, and an authentic everyday feel.",
    },
    {
      role: "photo-worthy",
      theme: "Photogenic highlights",
      guidance:
        "Favour visually impressive, viral, or skyline/waterfront/photo-friendly places.",
    },
    {
      role: "special-interest",
      theme: "Special interests day",
      guidance:
        "Lean into the strongest requested interests and make the day feel meaningfully different from earlier days.",
    },
  ];

  if (hasInterest(safe, "anime")) {
    pool.push({
      role: "anime-pop-culture",
      theme: "Anime and pop culture",
      guidance:
        "Use anime, manga, gaming, themed stores, arcades, or pop-culture districts where sensible.",
    });
  }

  if (hasInterest(safe, "nightlife")) {
    pool.push({
      role: "evening-vibes",
      theme: "Evening vibes and nightlife",
      guidance:
        "Create a day with stronger evening atmosphere, live music, rooftops, bars, or lively night districts where appropriate.",
    });
  }

  if (hasInterest(safe, "beaches")) {
    pool.push({
      role: "beach-coastal",
      theme: "Beach and coastal day",
      guidance:
        "Use beaches, coastal walks, waterfront relaxation, and scenic seaside stops.",
    });
  }

  if (hasInterest(safe, "theme parks") || isFamily) {
    pool.push({
      role: "family-fun",
      theme: "Family fun",
      guidance:
        "Use kid-suitable attractions, hands-on stops, easier logistics, breaks, and practical pacing.",
    });
  }

  if (hasInterest(safe, "relaxation")) {
    pool.push({
      role: "slow-relaxing",
      theme: "Slow and relaxing day",
      guidance:
        "Create a lighter day with scenic cafes, easy walking, pleasant views, restful breaks, and less rushing.",
    });
  }

  return pool;
}

function buildTripBlueprint(safe: SafeRequest): BlueprintDay[] {
  const isFamily = safe.people === "family" || safe.childAges !== "none";
  const rolePool = getRolePool(safe);

  const startRole =
    safe.arrivalTime != null
      ? {
          role: "arrival-easy-start",
          theme: "Easy arrival and nearby highlights",
          guidance:
            "Make Day 1 lighter. Stay near the accommodation or easy-access core area. Keep transfers short.",
        }
      : {
          role: "intro-highlights",
          theme: "Arrival-style city introduction",
          guidance:
            "Start with the destination's most rewarding easy-access highlights and set up the rest of the trip.",
        };

  const endRole =
    safe.departTime != null
      ? {
          role: "wrap-up-departure",
          theme: "Easy wrap-up and final favourites",
          guidance:
            "Keep the final day lighter and practical. Use nearby favourites, easy shopping, or a scenic last stop before departure.",
        }
      : {
  role: "wrap-up-unique-finish",
  theme: "Unique final day and relaxed finish",
  guidance:
    "Do not repeat earlier headline attractions. Use different neighbourhoods, lighter local discoveries, easy shopping, a final food-focused stop, or a calm scenic close that has not already been used.",
};

  const blueprint: BlueprintDay[] = [];
  blueprint.push({
    day: 1,
    role: startRole.role,
    theme: startRole.theme,
    guidance: startRole.guidance,
  });

  const reusableRoles = rolePool.filter((r) => r.role !== startRole.role);
  let poolIndex = 0;

  for (let day = 2; day <= safe.days; day++) {
    const isLast = day === safe.days;

    if (isLast) {
      blueprint.push({
        day,
        role: endRole.role,
        theme: endRole.theme,
        guidance: endRole.guidance,
      });
      continue;
    }

    const next = reusableRoles[poolIndex % reusableRoles.length];
    const themeSuffix =
      day >= 6 && next.role === "iconic-highlights"
        ? " (different zone or angle)"
        : "";

    blueprint.push({
      day,
      role: next.role,
      theme: `${next.theme}${themeSuffix}`,
      guidance: next.guidance,
    });

    poolIndex += 1;
  }

  return blueprint.slice(0, safe.days);
}

function formatBlueprintForPrompt(days: BlueprintDay[]) {
  return days
    .map(
      (d) =>
        `Day ${d.day}: ${d.theme} [${d.role}] - ${d.guidance}`
    )
    .join("\n");
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

function isPaidPlan(plan: AppPlan) {
  return plan === "plus" || plan === "pro";
}

function getPlanLimit(plan: AppPlan) {
  if (plan === "plus") return 20;
  if (plan === "pro") return Number.POSITIVE_INFINITY;
  return 4;
}

function getFreeMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

async function getUsage(userId: string): Promise<UsageInfo> {
  const supabase = createSupabaseServerClient();
  const now = new Date();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, subscription_status, current_period_start, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Profile read error:", profileError);
    throw new Error("Failed to read billing profile");
  }

  const rawPlan = (profile?.plan ?? "free") as AppPlan;
  const currentPeriodStart = parseSupabaseDate(profile?.current_period_start);
  const currentPeriodEnd = parseSupabaseDate(profile?.current_period_end);

  const paidActive =
    isPaidPlan(rawPlan) &&
    (profile?.subscription_status === "active" ||
      profile?.subscription_status === "trialing") &&
    currentPeriodStart !== null &&
    currentPeriodEnd !== null &&
    now >= currentPeriodStart &&
    now < currentPeriodEnd;

  const effectivePlan: AppPlan = paidActive ? rawPlan : "free";
  const limit = getPlanLimit(effectivePlan);

  const periodKey = paidActive
    ? currentPeriodStart.toISOString()
    : getFreeMonthKey(now);

  const periodStart = paidActive ? currentPeriodStart.toISOString() : null;
  const periodEnd = paidActive ? currentPeriodEnd.toISOString() : null;

  const { data: usageRow, error: usageError } = await supabase
    .from("user_usage")
    .select("itineraries")
    .eq("user_id", userId)
    .eq("period_key", periodKey)
    .maybeSingle();

  if (usageError) {
    console.error("Usage read error:", usageError);
    throw new Error("Failed to read usage");
  }

  const used = usageRow?.itineraries ?? 0;

  return {
    allowed: used < limit,
    plan: effectivePlan,
    used,
    limit,
    periodKey,
    periodStart,
    periodEnd,
  };
}

async function incrementUsage(userId: string, usage: UsageInfo) {
  const supabase = createSupabaseServerClient();

  const { data: existing, error: readError } = await supabase
    .from("user_usage")
    .select("itineraries")
    .eq("user_id", userId)
    .eq("period_key", usage.periodKey)
    .maybeSingle();

  if (readError) {
    console.error("Usage read error:", readError);
    return;
  }

  const nextCount = (existing?.itineraries ?? 0) + 1;

  const { error: upsertError } = await supabase.from("user_usage").upsert(
    {
      user_id: userId,
      period_key: usage.periodKey,
      period_start: usage.periodStart,
      period_end: usage.periodEnd,
      plan: usage.plan,
      itineraries: nextCount,
    },
    { onConflict: "user_id,period_key" }
  );

  if (upsertError) {
    console.error("Usage increment error:", upsertError);
  }
}

async function acquireGenerationLock(
  userId: string,
  seconds = 45
): Promise<GenerationLockResult> {
  const supabase = createSupabaseServerClient();
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + seconds * 1000).toISOString();

  const { data: existing, error: readError } = await supabase
    .from("generation_locks")
    .select("locked_until")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    console.error("Lock read error:", readError);
    throw new Error("Failed to check generation lock");
  }

  if (
    existing?.locked_until &&
    new Date(existing.locked_until).getTime() > now.getTime()
  ) {
    return {
      acquired: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil(
          (new Date(existing.locked_until).getTime() - now.getTime()) / 1000
        )
      ),
    };
  }

  const { error: upsertError } = await supabase
    .from("generation_locks")
    .upsert(
      {
        user_id: userId,
        locked_until: lockedUntil,
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    console.error("Lock upsert error:", upsertError);
    throw new Error("Failed to create generation lock");
  }

  return { acquired: true, retryAfterSeconds: 0 };
}

async function releaseGenerationLock(userId: string) {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("generation_locks")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Lock release error:", error);
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
  "seoTitle": "string",
  "seoDescription": "string",
  "h1": "string",
  "introParagraph": "string",
  "overviewBullets": ["string"],
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
- The object may contain only these keys: seoTitle, seoDescription, h1, introParagraph, overviewBullets, itinerary.
- itinerary must be an array.
- overviewBullets must be an array of short strings.
- dailyCostEstimate must equal the sum of costEstimate values.
- Keep notes short and useful.
- area should be short.
- mapQuery should be concise.
- seoTitle should sound natural and search-friendly.
- seoDescription should be under 160 characters where possible.
- h1 should be human-friendly and SEO-friendly.
- Do not use vague labels like "mid", "balanced", "packed", or "hotel-ready" in seoTitle or h1.
`;

async function callModel(params: {
  prompt: string;
  maxTokens: number;
}): Promise<ParsedAiItinerary> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "developer", content: GPT5_SCHEMA_PROMPT },
      { role: "user", content: params.prompt },
    ],
    max_completion_tokens: params.maxTokens,
  });

  const content = completion.choices[0]?.message?.content;
  const text = typeof content === "string" ? content.trim() : "";

  if (!text) {
    console.error(
      "Empty model message:",
      JSON.stringify(completion.choices[0]?.message, null, 2)
    );
    throw new Error("Model returned empty response");
  }

  try {
    return JSON.parse(text) as ParsedAiItinerary;
  } catch {
    try {
      const jsonText = extractJson(text);
      return JSON.parse(jsonText) as ParsedAiItinerary;
    } catch {
      console.error("Raw model response:", text);
      throw new Error("Model returned invalid JSON");
    }
  }
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
  usedThemes: string[];
  blueprintDays: BlueprintDay[];
}) {
  const {
    safe,
    chunkIndex,
    chunkCount,
    chunkDays,
    chunkDates,
    stopsPerDay,
    usedTitles,
    usedAreas,
    usedThemes,
    blueprintDays,
  } = params;

  const interestsText = buildInterestLabel(safe);
  const isFirstChunk = chunkIndex === 0;
  const isLastChunk = chunkIndex === chunkCount - 1;
  const blueprintText = formatBlueprintForPrompt(blueprintDays);
  const destinationGuidance = buildDestinationSpecificGuidance(safe);
  const dayTripRules = buildDayTripRules(safe);
  const travelMonth =
  safe.startDate
    ? new Date(safe.startDate).toLocaleString("en-US", { month: "long" })
    : "unknown";

  return `
Create a ${chunkDays}-day itinerary for part ${chunkIndex + 1} of ${chunkCount}.

${buildDestinationContext(safe)}
People: ${safe.people}
Budget: ${safe.budget}
Pace: ${safe.pace}
Interests: ${interestsText}
Dates: ${chunkDates.length ? chunkDates.join(", ") : "flexible"}
Travel month: ${travelMonth}
Stops per day: ${stopsPerDay}

Arrival time: ${isFirstChunk ? safe.arrivalTime ?? "not provided" : "not relevant"}
Departure time: ${isLastChunk ? safe.departTime ?? "not provided" : "not relevant"}
Kids age group: ${safe.childAges}

Trip blueprint for this chunk:
${blueprintText}

Already used stop titles in earlier chunks:
${usedTitles.length ? usedTitles.join(" | ") : "none"}

Already used areas in earlier chunks:
${usedAreas.length ? usedAreas.join(" | ") : "none"}

Already used day themes in earlier chunks:
${usedThemes.length ? usedThemes.join(" | ") : "none"}

Interpret the interests like this:
- Food = good local eats, famous food spots, markets, snacks, signature dishes
- Sightseeing = iconic landmarks, must-see areas, city highlights, viewpoints
- Shopping = famous shopping streets, malls, local retail areas, markets
- Nature = parks, gardens, scenic lookouts, coastal walks, mountain or lake areas
- Theme parks = amusement parks, major rides, family entertainment parks
- Museums = strong museums, galleries, cultural institutions, historic sites
- Anime = anime, manga, gaming, pop culture, themed stores, arcades
- Beaches = beaches, waterfront relaxation, coastal activities, scenic seaside areas
- Night markets = lively evening food/shopping markets and night bazaar style areas
- Hidden gems = lesser-known but worthwhile places that still feel special
- Local experiences = neighbourhoods, authentic local areas, culture, street life
- Family-friendly = easier pacing, kid-suitable attractions, hands-on stops, breaks
- Nightlife = bars, live music, rooftop areas, late-night districts, evening atmosphere
- Relaxation = slower pace, scenic cafes, spa-style areas, easy walks, restful stops
- Instagram spots = photogenic places, viral visuals, pretty streets, skyline/photo views

Destination-specific guidance:
${destinationGuidance}

Nearby trip realism rules:
${dayTripRules}

Strict rules:
- Return JSON ONLY matching the schema exactly.
- Provide exactly ${stopsPerDay} stops per day before any later filtering.
- Day numbering inside this chunk must start from 1 and increase by 1.
- Every day must follow the assigned blueprint day theme and guidance.
- Use the destination exactly as provided. Do not switch to another city or country unless it is a clearly sensible nearby day trip.
- Use attractive, recognisable, worthwhile places and activities.
- Avoid generic filler like "local museum", "market", "park", or "shopping street" unless it is a specifically named and worthwhile venue.
- Do NOT repeat the same attraction, museum, market, lookout, beach, harbour, bridge walk, food market, neighbourhood, or mall across days.
- Do NOT repeat the same venue from earlier chunks.
- Do NOT make multiple days feel like the same pattern with only minor changes.
- Each day must feel clearly different from the others in both area and day style.
- For full sightseeing days, include a mix of morning, afternoon, and evening stops.
- Group itinerary into 1–2 accommodation bases for the entire trip.
- Stay in each base for at least 2 consecutive days.
- Do NOT switch base every day unless absolutely necessary.
- Each day must be planned around the current base location.
- HARD CONSTRAINT: Prefer one accommodation base for the first half of the trip and one accommodation base for the second half of the trip.
- HARD CONSTRAINT: Do not recommend returning to a previous accommodation base later in the itinerary after moving to a new base.
- HARD CONSTRAINT: If Days 1 and 2 are in the same zone, keep the recommended hotel area the same unless there is a strong reason to move.
- HARD CONSTRAINT: For Bali, prefer a clean progression such as Uluwatu/South Bali -> Seminyak-Canggu -> Ubud, or Ubud -> Seminyak-Canggu, instead of bouncing back and forth.
- HARD CONSTRAINT: When changing to a new base area, the rest of that day and the following day should mainly stay around that new base.
- Only make Day 1 lighter if arrivalTime is provided.
- Only make the final day lighter if departTime is provided.
- Middle days should feel like full days, not dinner-only or night-only plans.
- Make it map-friendly: cluster places each day to reduce backtracking.
- Make the trip flow logically across days, not just within each day.
- If two days naturally belong to the same base area, keep them adjacent instead of revisiting that area later.
- Prefer a zone-by-zone flow across the trip.
- Do not bounce between opposite areas on Day 2 and Day 5 if those places could be grouped together earlier.
- Major theme parks such as Universal Studios or Disneyland should usually take a full day, especially for families.
- HARD CONSTRAINT: If a major anchor attraction (theme park, large zoo, major aquarium, full-day tour) is included:
  - It MUST take at least 6 hours of the schedule.
  - Do NOT schedule another major attraction on the same day.
  - Only allow 1–2 nearby minor activities after it (e.g. dinner, short walk).

- HARD CONSTRAINT: Do NOT include more than ONE major anchor attraction per day.

- HARD CONSTRAINT: Do NOT schedule more than 2 different areas in one day.
  - Prefer all stops to be in the same district or adjacent districts.

- HARD CONSTRAINT: Total realistic day duration must be between 8–10 hours.
  - Do not compress multiple large attractions into a short time window.

- HARD CONSTRAINT: If an attraction is described as "full day", it must NOT end before late afternoon (~16:00–18:00).
- Do not schedule another major attraction after a full-day theme park.
- Only allow a light nearby evening stop after a full-day theme park, such as dinner or a short walk.
- If an activity is inside a major attraction (e.g. Universal Studios, Disneyland),
  do NOT list it as a separate time block. Merge it into the main activity.
- Large aquariums, major zoos, major museums, and extensive heritage complexes should usually be treated as half-day anchors.
- Avoid unrealistic short durations for major attractions.
- If a stop would normally take half a day or more, build the rest of the day around it sensibly.
- When recommending a stay area, keep the next major stops aligned with that area instead of suggesting unnecessary return travel later in the trip.
- Prefer named, attractive, high-interest stops over vague categories.
- If interests include Sightseeing, include famous must-see landmarks and recognisable city highlights.
- If interests include Hidden gems, include at least 1 less-obvious but worthwhile stop on suitable days.
- If interests include Local experiences, include neighbourhoods or authentic local areas, not only tourist icons.
- If interests include Family-friendly, favour easier logistics, fun stops, and practical pacing.
- If interests include Nightlife, include at least one evening-focused stop where suitable.
- If interests include Relaxation, reduce over-packing and include calmer scenic breaks.
- If interests include Instagram spots, favour visually attractive places and views.
- If kids age group is baby/toddler/kids: stroller-friendly, shorter travel hops, include breaks, early dinner, avoid late-night activities.
- Include at least 1 kid-appropriate stop per day when kids age group != none.
- Keep notes short.
- Themes must be specific and varied. Avoid repeating generic theme labels like "Best of the city" on multiple days.
- Do NOT include unrealistic same-day long-distance trips from the base city.
- Do NOT schedule a far day trip unless departure starts early in the morning and the full day is built around that trip.
- Never place the start of a major out-of-city drive in the afternoon or evening.
- For family trips, avoid exhausting out-and-back travel days.
- If a destination is too far for a comfortable day trip, replace it with a closer option.
- SEASONAL INTELLIGENCE:
- Consider destination climate and travel month when selecting activities.
- Adapt itinerary to match local season (e.g. winter, summer, rainy season).

- HARD CONSTRAINT: In winter destinations, prioritize seasonal activities such as skiing, snowboarding, snow scenic areas, hot springs, and indoor attractions.
- HARD CONSTRAINT: In summer destinations, prioritize outdoor activities, beaches, nature, and extended daylight usage.
- HARD CONSTRAINT: In tropical destinations (e.g. Bali), consider rainy vs dry season and avoid outdoor-heavy plans during heavy rain periods.
- HARD CONSTRAINT: Do NOT suggest activities that are unrealistic for the season (e.g. beach day in winter, skiing in summer).


SEO requirements:
- Also create SEO-friendly fields for the whole trip.
- seoTitle should target a phrase a real person might search for.
- h1 should be clear and natural.
- introParagraph should be 2 to 3 sentences and naturally mention the destination, trip length, and traveller type.
- overviewBullets should summarise the days in short bullet form.
- Avoid weak titles like:
  - "${safe.days}-day ${safe.destination} (${safe.budget})"
  - "mid"
  - "balanced"
  - "packed"
  - "hotel-ready"
- Prefer titles like:
  - "3 Day Singapore Itinerary for Families (2026)"
  - "7 Day Tokyo Itinerary for First-Time Visitors (2026)"
  - "5 Day Bali Itinerary for Couples (2026)"
- Use specific place names where relevant.
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
  usedThemes: string[];
  blueprintDays: BlueprintDay[];
}): Promise<ParsedAiItinerary> {
  const prompt = buildChunkPrompt(params);

  const parsed = await callModel({
    prompt,
    maxTokens: 2800,
  });

  const chunk = Array.isArray(parsed.itinerary)
    ? parsed.itinerary.slice(0, params.chunkDays)
    : [];

  if (chunk.length === 0) {
    throw new Error(`Chunk ${params.chunkIndex + 1} returned no days`);
  }

  return {
    ...parsed,
    itinerary: chunk,
  };
}

export async function POST(req: Request) {
  const { userId } = await auth();
  const ownerUserId = userId ?? null;
  const isGuest = !ownerUserId;

  if (!isGuest) {
    const lock = await acquireGenerationLock(ownerUserId, 45);

    if (!lock.acquired) {
      return NextResponse.json(
        {
          error: `A trip is already being generated. Please wait about ${lock.retryAfterSeconds} seconds and try again.`,
        },
        { status: 429 }
      );
    }
  }

  try {
    const supabase = createSupabaseServerClient();
    const usage: UsageInfo | null = !isGuest ? await getUsage(ownerUserId) : null;

    if (usage && !usage.allowed) {
      const limitLabel =
        usage.limit === Number.POSITIVE_INFINITY
          ? "unlimited"
          : String(usage.limit);

      return NextResponse.json(
        {
          error: `You have reached your limit of ${limitLabel} itineraries for the current billing period on the ${usage.plan} plan.`,
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

    const blueprint = buildTripBlueprint(safe);

    const resolvedChunks: Array<{
      chunkIndex: number;
      chunkDates: string[];
      chunkDays: number;
      parsed: ParsedAiItinerary;
    }> = [];

    const usedTitles: string[] = [];
    const usedAreas: string[] = [];
    const usedThemes: string[] = [];

    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
      const chunkDates = dates.length > 0 ? dateChunks[chunkIndex] : [];
      const chunkDays =
        chunkDates.length > 0
          ? chunkDates.length
          : Math.min(chunkSize, safe.days - chunkIndex * chunkSize);

      const startDayNumber = chunkIndex * chunkSize + 1;
      const endDayNumber = Math.min(safe.days, startDayNumber + chunkDays - 1);
      const blueprintDays = blueprint.filter(
        (d) => d.day >= startDayNumber && d.day <= endDayNumber
      );

      const parsedChunk = await generateChunk({
        safe,
        chunkIndex,
        chunkCount,
        chunkDays,
        chunkDates,
        stopsPerDay,
        usedTitles: [...usedTitles],
        usedAreas: [...usedAreas],
        usedThemes: [...usedThemes],
        blueprintDays,
      });

      const chunk = Array.isArray(parsedChunk.itinerary)
        ? parsedChunk.itinerary
        : [];

      for (const day of chunk) {
        if (typeof day.theme === "string" && day.theme.trim()) {
          usedThemes.push(day.theme.trim());
        }

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
        parsed: parsedChunk,
      });
    }

    resolvedChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    const allGeneratedDays: NonNullable<ParsedAiItinerary["itinerary"]> = [];
    let globalDayNumber = 1;

    for (const resolved of resolvedChunks) {
      const chunkItinerary = Array.isArray(resolved.parsed.itinerary)
        ? resolved.parsed.itinerary.slice(0, resolved.chunkDays)
        : [];

      for (let i = 0; i < chunkItinerary.length; i++) {
        const item = chunkItinerary[i];
        const blueprintDay = blueprint[globalDayNumber - 1];

        allGeneratedDays.push({
          ...item,
          day: globalDayNumber,
          theme:
            typeof item.theme === "string" && item.theme.trim()
              ? item.theme.trim()
              : blueprintDay?.theme ?? `Day ${globalDayNumber}`,
          date:
            resolved.chunkDates[i] ??
            (safe.startDate
              ? addDays(safe.startDate, globalDayNumber - 1)
              : null),
        });

        globalDayNumber += 1;
      }
    }

    const itinerary: ItineraryDay[] = [];
    const seenTripStops = new Set<string>();

    for (let idx = 0; idx < allGeneratedDays.slice(0, safe.days).length; idx++) {
      const d = allGeneratedDays[idx];
      const rawStops = Array.isArray(d.stops)
        ? (d.stops as StopWithTime[])
        : [];

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

   const flowedStops = enforceOneWayAreaFlow(normalizedStops);

const dedupedWithinDay = dedupeStopsWithinDay(
  flowedStops,
  safe.destination
);

      const dedupedAcrossTrip = dedupeStopsAcrossTrip(
        dedupedWithinDay,
        seenTripStops
      );

      const minStopsForDay =
        isDay1 || isLastDay ? Math.max(2, stopsPerDay - 1) : stopsPerDay;

  const cleanedStops = ensureMinimumStops(
  dedupedAcrossTrip,
  flowedStops,
  minStopsForDay,
  seenTripStops
);

      const dailyCostEstimate = cleanedStops.reduce(
        (sum, stop) => sum + stop.costEstimate,
        0
      );

      const blueprintDay = blueprint[idx];

      itinerary.push({
        day: idx + 1,
        date: safe.startDate ? addDays(safe.startDate, idx) : undefined,
        theme:
          typeof d.theme === "string" && d.theme.trim()
            ? d.theme.trim()
            : blueprintDay?.theme || `Day ${idx + 1}`,
        stops: cleanedStops,
        dailyCostEstimate,
      });
    }

    const seoSource = resolvedChunks[0]?.parsed;

const seoTitle = buildSeoTitle(safe);
const seoDescription = buildSeoDescription(safe);
const h1 = buildSeoH1(safe);
const introParagraph = buildFallbackIntroParagraph(safe);

const overviewBulletsFromAi = sanitizeOverviewBullets(
  seoSource?.overviewBullets
);

    const overviewBullets =
      overviewBulletsFromAi.length > 0
        ? overviewBulletsFromAi
        : itinerary.map((day) => `Day ${day.day}: ${day.theme}`);

    const responseBody = {
      input: safe,
      seo: {
        seoTitle,
        seoDescription,
        h1,
        introParagraph,
        overviewBullets,
      },
      itinerary,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "openai",
        model: "chunked:gpt-4o-mini-blueprint",
      },
    };

    if (isGuest) {
      void logToGoogleSheets({
        type: "itinerary_preview",
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
        source: "generate_api_openai_gpt4omini_blueprint_preview",
      });

      return NextResponse.json({
        ...responseBody,
        savedTrip: null,
        usage: null,
      });
    }

    const tripTitle = buildSeoH1(safe);

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    const { data: recentTrips, error: recentTripsError } = await supabase
      .from("itineraries")
      .select("id, slug, title, destination, created_at, raw_prompt")
      .eq("user_id", ownerUserId)
      .gte("created_at", oneMinuteAgo)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentTripsError) {
      console.error("Recent trips check error:", recentTripsError);
    }

    const duplicateTrip = (recentTrips ?? []).find((trip: any) => {
      try {
        const existingInput = JSON.parse(trip.raw_prompt || "{}");

        return (
          existingInput.destination === safe.destination &&
          existingInput.days === safe.days &&
          existingInput.people === safe.people &&
          existingInput.budget === safe.budget &&
          existingInput.pace === safe.pace &&
          (existingInput.startDate ?? null) === (safe.startDate ?? null) &&
          (existingInput.arrivalTime ?? null) === (safe.arrivalTime ?? null) &&
          (existingInput.departTime ?? null) === (safe.departTime ?? null) &&
          JSON.stringify(existingInput.interests ?? []) ===
            JSON.stringify(safe.interests ?? [])
        );
      } catch {
        return false;
      }
    });

    const activeUsage = usage as UsageInfo;

    if (duplicateTrip) {
      return NextResponse.json({
        ...responseBody,
        savedTrip: {
          id: duplicateTrip.id,
          slug: duplicateTrip.slug,
          title: duplicateTrip.title,
          destination: duplicateTrip.destination,
          created_at: duplicateTrip.created_at,
        },
        usage: {
          plan: activeUsage.plan,
          used: activeUsage.used,
          limit:
            activeUsage.limit === Number.POSITIVE_INFINITY
              ? "unlimited"
              : activeUsage.limit,
          periodKey: activeUsage.periodKey,
          periodStart: activeUsage.periodStart,
          periodEnd: activeUsage.periodEnd,
        },
      });
    }

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
      slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
    }

    const { data: savedTrip, error: saveError } = await supabase
      .from("itineraries")
      .insert([
        {
          user_id: ownerUserId,
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
      .single<SavedTrip>();

    if (saveError || !savedTrip) {
      console.error("Supabase save error:", saveError);
      return NextResponse.json(
        { error: "Itinerary generated but failed to save" },
        { status: 500 }
      );
    }

    void incrementUsage(ownerUserId, activeUsage);
    const nextUsed = activeUsage.used + 1;

    void logToGoogleSheets({
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
      source: "generate_api_openai_gpt4omini_blueprint_with_seo",
      savedTripId: savedTrip.id,
      clerkUserId: ownerUserId,
      plan: activeUsage.plan,
      usageCount: nextUsed,
      usageLimit:
        activeUsage.limit === Number.POSITIVE_INFINITY
          ? "unlimited"
          : activeUsage.limit,
      periodKey: activeUsage.periodKey,
      periodStart: activeUsage.periodStart,
      periodEnd: activeUsage.periodEnd,
    });

    return NextResponse.json({
      ...responseBody,
      savedTrip,
      usage: {
        plan: activeUsage.plan,
        used: nextUsed,
        limit:
          activeUsage.limit === Number.POSITIVE_INFINITY
            ? "unlimited"
            : activeUsage.limit,
        periodKey: activeUsage.periodKey,
        periodStart: activeUsage.periodStart,
        periodEnd: activeUsage.periodEnd,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("Generate route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (ownerUserId) {
      await releaseGenerationLock(ownerUserId);
    }
  }
}