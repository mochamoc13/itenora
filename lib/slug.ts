export function makeTripSlug(input: {
  destination: string;
  days: number;
  budget?: string;
  people?: string;
}) {
  const parts = [
    input.destination,
    `${input.days}-day`,
    input.people || "",
    input.budget || "",
    "itinerary",
  ];

  return parts
    .join(" ")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function addSlugSuffix(slug: string, suffix: string) {
  return `${slug}-${suffix.toLowerCase()}`;
}