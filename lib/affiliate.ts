export function addDays(dateString: string, days: number) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return undefined;

  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildHotelAffiliateLink(params: {
  destination?: string;
  area?: string;
  checkIn?: string;
  checkOut?: string;
}) {
  const { destination, area, checkIn, checkOut } = params;

  const url = new URL("https://www.agoda.com/search");
  const cityQuery = [area, destination].filter(Boolean).join(", ");

  if (cityQuery) {
    url.searchParams.set("city", cityQuery);
  } else if (destination) {
    url.searchParams.set("city", destination);
  }

  if (checkIn) {
    url.searchParams.set("checkIn", checkIn);
  }

  if (checkOut) {
    url.searchParams.set("checkOut", checkOut);
  }

  return url.toString();
}

// ---------- KLOOK (Activities) ----------

type KlookMatch = {
  directUrl: string;
  affiliateUrl?: string;
};

function clean(value?: string) {
  return (value || "").toLowerCase().trim();
}

function pickKlookUrl(match: KlookMatch) {
  return match.affiliateUrl?.trim() || match.directUrl;
}

function getKlookMappedActivity(title?: string, destination?: string): KlookMatch | null {
  const t = clean(title);
  const d = clean(destination);

  // ---------- SINGAPORE ----------
  if (d.includes("singapore")) {
    if (t.includes("universal")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/141-universal-studios-singapore/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F117-universal-studios-singapore%2F",
      };
    }

    if (t.includes("gardens by the bay")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/114-gardens-by-the-bay-singapore/",
        affiliateUrl: 
        "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F127-gardens-by-the-bay-singapore%2F",
      };
    }

    if (t.includes("night safari")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/32-night-safari-singapore/",
        affiliateUrl: 
        "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F3928-singapore-night-safari-singapore%2F",
      };
    }

    if (t.includes("zoo")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/31-singapore-zoo-singapore/",
        affiliateUrl: 
        "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F141-singapore-zoo-singapore%2F",
      };
    }

    if (
      t.includes("aquarium") ||
      t.includes("s.e.a.") ||
      t.includes("sea aquarium")
    ) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/129-sea-aquarium-singapore/",
        affiliateUrl: 
        "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F119-singapore-oceanarium%2F",
      };
    }
  }

  // ---------- HONG KONG ----------
  if (d.includes("hong kong")) {
    if (t.includes("disney")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/39-hong-kong-disneyland-resort-hong-kong/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F39-hong-kong-disneyland-resort-hong-kong%2F",
      };
    }
  }

  // ---------- OSAKA ----------
  if (d.includes("osaka")) {
    if (t.includes("universal")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/search/result/?query=universal%20studios%20japan%20osaka",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F46604-universal-studios-japan-e-ticket-osaka-qr-code-direct-entry%2F",
      };
    }
  }

  // ---------- BALI ----------
  if (d.includes("bali")) {
    if (t.includes("nusa penida")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/15758-nusa-penida-full-day-trip-bali/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F15758-nusa-penida-full-day-trip-bali%2F",
      };
    }
  }

  // ---------- SEOUL ----------
  if (d.includes("seoul")) {
    if (t.includes("lotte world")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/251-lotte-world-seoul/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F251-lotte-world-seoul%2F",
      };
    }
  }

  // ---------- BUSAN ----------
  if (d.includes("busan")) {
    if (
      t.includes("haeundae blueline") ||
      t.includes("blueline park") ||
      t.includes("blue line park")
    ) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/133293-haeundae-blueline-park-ticket-in-busan/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F133293-haeundae-blueline-park-ticket-in-busan%2F",
      };
    }
  }

  // ---------- JEJU ----------
  if (d.includes("jeju")) {
    if (
      t.includes("south west") ||
      t.includes("southwest") ||
      t.includes("winter tour")
    ) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/132387-jeju-south-west-1-day-authentic-winter-tour/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F132387-jeju-south-west-1-day-authentic-winter-tour%2F",
      };
    }
  }

  // ---------- GOLD COAST ----------
  if (d.includes("gold coast")) {
    if (t.includes("dreamworld")) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/2807-dreamworld-entry-ticket-gold-coast/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F2807-dreamworld-entry-ticket-gold-coast%2F",
      };
    }
  }

  // ---------- MELBOURNE ----------
  if (d.includes("melbourne")) {
    if (
      t.includes("great ocean road") ||
      t.includes("12 apostles") ||
      t.includes("twelve apostles")
    ) {
      return {
        directUrl:
          "https://www.klook.com/en-AU/activity/156183-great-ocean-road-12-apostles-full-day-tour-from-melbourne/",
        affiliateUrl:
          "https://affiliate.klook.com/redirect?aid=117141&aff_adid=1245957&k_site=https%3A%2F%2Fwww.klook.com%2Factivity%2F156183-great-ocean-road-12-apostles-full-day-tour-from-melbourne%2F",
      };
    }
  }

  return null;
}

export function buildKlookActivityLink(title?: string, destination?: string) {
  const mapped = getKlookMappedActivity(title, destination);

  if (mapped) {
    return pickKlookUrl(mapped);
  }

  const query = [title, destination].filter(Boolean).join(" ").trim();

  return `https://www.klook.com/en-AU/search/result/?query=${encodeURIComponent(
    query
  )}`;
}

export function isBookableActivity(title?: string) {
  const t = clean(title);

  return [
    "universal",
    "disney",
    "zoo",
    "aquarium",
    "museum",
    "tower",
    "theme park",
    "ticket",
    "safari",
    "cruise",
    "tour",
    "observation",
    "cable car",
    "teamlab",
    "ghibli",
    "lotte world",
    "gardens by the bay",
    "dreamworld",
    "great ocean road",
    "12 apostles",
    "twelve apostles",
    "blueline",
    "blue line",
    "nusa penida",
  ].some((keyword) => t.includes(keyword));
}