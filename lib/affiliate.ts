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