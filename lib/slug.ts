export function makeTripSlug(input: {
  destination: string;
  days: number;
  budget?: string;
  people?: string;
}) {
  const destination = input.destination
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")   // remove weird chars
    .trim()
    .replace(/\s+/g, "-");

  const people = input.people ? `-${input.people}` : "";

  return `${destination}-${input.days}-day${people}-itinerary`
    .replace(/-+/g, "-")           // clean double dashes
    .replace(/^-|-$/g, "");        // trim edges
}