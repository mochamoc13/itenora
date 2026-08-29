export type KlookPromo = {
  code: string;
  title: string;
  discountLabel: string;
  destinationKeywords: string[];
  validFrom?: string;
  validUntil: string;
  bookingUrl?: string;
};

// Add only current, authorised Klook affiliate promotions here. Expired offers
// disappear automatically. Keep destinationKeywords lowercase.
export const KLOOK_PROMOS: KlookPromo[] = [];

function startOfUtcDay(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfUtcDay(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}

export function getActiveKlookPromos(
  destination: string,
  now = new Date()
) {
  const destinationKey = destination.toLowerCase();

  return KLOOK_PROMOS.filter((promo) => {
    const starts = promo.validFrom ? startOfUtcDay(promo.validFrom) : null;
    const ends = endOfUtcDay(promo.validUntil);
    const isCurrent = (!starts || now >= starts) && now <= ends;
    const isRelevant =
      promo.destinationKeywords.length === 0 ||
      promo.destinationKeywords.some((keyword) =>
        destinationKey.includes(keyword)
      );

    return isCurrent && isRelevant;
  }).slice(0, 3);
}
