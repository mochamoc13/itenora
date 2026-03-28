export function buildHotelAffiliateLink(params: {
  destination: string;
  area?: string;
  checkIn?: string;
  checkOut?: string;
}) {
  const { destination, area, checkIn, checkOut } = params;

  const searchText = area
    ? `${area}, ${destination}`
    : destination;

  // Replace this with your real affiliate URL later
  // Example:
  // const baseUrl = "https://www.booking.com/searchresults.html";
  const baseUrl = "https://www.booking.com/searchresults.html";

  const url = new URL(baseUrl);

  // Basic search query
  url.searchParams.set("ss", searchText);

  // Optional dates
  if (checkIn) {
    const [year, month, day] = checkIn.split("-");
    url.searchParams.set("checkin_year", year);
    url.searchParams.set("checkin_month", String(Number(month)));
    url.searchParams.set("checkin_monthday", String(Number(day)));
  }

  if (checkOut) {
    const [year, month, day] = checkOut.split("-");
    url.searchParams.set("checkout_year", year);
    url.searchParams.set("checkout_month", String(Number(month)));
    url.searchParams.set("checkout_monthday", String(Number(day)));
  }

  // Optional affiliate marker
  // Replace "YOUR_AFFILIATE_ID" later if your partner program gives one
  // url.searchParams.set("aid", "YOUR_AFFILIATE_ID");

  return url.toString();
}

export function addDays(dateString: string, days: number) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}