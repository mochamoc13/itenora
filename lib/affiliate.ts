export function buildAgodaLink(params: {
  destination: string;
  checkIn?: string;
  checkOut?: string;
}) {
  const { destination, checkIn, checkOut } = params;

  const base = "https://www.agoda.com/search";
  const url = new URL(base);

  url.searchParams.set("city", destination);

  if (checkIn) {
    url.searchParams.set("checkIn", checkIn);
  }

  if (checkOut) {
    url.searchParams.set("checkOut", checkOut);
  }

  return url.toString();
}

export function getSuggestedStayArea(destination: string) {
  const d = destination.toLowerCase();

  if (d.includes("tokyo")) return "Shinjuku or Ueno";
  if (d.includes("osaka")) return "Namba";
  if (d.includes("kyoto")) return "Gion or Kyoto Station";
  if (d.includes("singapore")) return "Orchard, Bugis, or Marina Bay";
  if (d.includes("sydney")) return "CBD or Darling Harbour";
  if (d.includes("melbourne")) return "CBD or Southbank";

  return `central ${destination}`;
}