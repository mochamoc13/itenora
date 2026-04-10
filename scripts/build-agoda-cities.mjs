import fs from "fs";
import path from "path";
import { parse } from "csv-parse";

const inputCsv = path.join(
  process.cwd(),
  "imports",
  "agoda",
  "E342B777-64FD-4A49-9C9F-FEF4BA635863_EN.csv"
);

const outputTs = path.join(process.cwd(), "data", "agoda-cities.ts");

function normalize(value) {
  return (value || "").toString().trim().toLowerCase();
}

function looksBadCity(city) {
  if (!city) return true;

  const badPhrases = [
    "a refrigerator",
    "a coffee or tea maker",
    "bottled water",
    "instant coffee",
    "instant tea",
    "television",
    "cable tv",
    "hair dryer",
    "toiletries",
    "scrumptious",
    "breakfast",
    "mini bar",
    "guestroom",
    "restroom",
    "hotel offers",
    "hotel come",
    "selected rooms",
    "visitors can enjoy",
    "creating a delightful stay experience",
  ];

  if (city.length > 80) return true;
  return badPhrases.some((phrase) => city.includes(phrase));
}

function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  if (!fs.existsSync(inputCsv)) {
    throw new Error(`CSV not found: ${inputCsv}`);
  }

  const cityMap = new Map();

  const parser = fs
    .createReadStream(inputCsv, { encoding: "utf8" })
    .pipe(
      parse({
        columns: true,
        relax_quotes: true,
        relax_column_count: true,
        skip_empty_lines: true,
        bom: true,
      })
    );

  let count = 0;

  for await (const row of parser) {
    count += 1;

    const city = normalize(row.city);
    const country = normalize(row.country);
    const cityId = toInt(row.city_id);
    const reviews = toInt(row.number_of_reviews) ?? 0;

    if (!city || !country || !cityId) continue;
    if (looksBadCity(city)) continue;

    const key = `${city}|${country}`;
    const existing = cityMap.get(key);

    if (!existing || reviews > existing.reviews) {
      cityMap.set(key, {
        cityId,
        city,
        country,
        reviews,
      });
    }
  }

  const result = Array.from(cityMap.values())
    .sort((a, b) => {
      if (a.city < b.city) return -1;
      if (a.city > b.city) return 1;
      if (a.country < b.country) return -1;
      if (a.country > b.country) return 1;
      return 0;
    })
    .map(({ cityId, city, country }) => ({
      cityId,
      city,
      country,
    }));

  const output = `export type AgodaCity = {
  cityId: number;
  city: string;
  country: string;
};

export const AGODA_CITIES: AgodaCity[] = ${JSON.stringify(result, null, 2)};
`;

  fs.writeFileSync(outputTs, output, "utf8");

  console.log(`Parsed ${count} rows`);
  console.log(`✅ Built ${result.length} Agoda cities`);
  console.log(`✅ Output written to: ${outputTs}`);
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});