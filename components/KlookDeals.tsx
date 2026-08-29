import { buildKlookDestinationLink } from "@/lib/affiliate";
import { getActiveKlookPromos } from "@/data/klook-promos";
import TrackedAffiliateLink from "@/components/TrackedAffiliateLink";

export default function KlookDeals({ destination }: { destination: string }) {
  if (!destination) return null;

  const promos = getActiveKlookPromos(destination);
  const destinationLink = buildKlookDestinationLink(destination);

  return (
    <section className="rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
            Activities and travel deals
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">
            Check Klook options for {destination}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            Compare tickets and activities that match this itinerary before you
            book.
          </p>
        </div>

        <TrackedAffiliateLink
          href={destinationLink}
          partner="klook"
          label="destination-deals"
          destination={destination}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          Explore Klook deals
        </TrackedAffiliateLink>
      </div>

      {promos.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {promos.map((promo) => {
            const href = promo.bookingUrl || destinationLink;

            return (
              <div key={`${promo.code}-${promo.validUntil}`} className="rounded-2xl border border-orange-200 bg-white p-4">
                <div className="text-sm font-semibold text-orange-700">
                  {promo.discountLabel}
                </div>
                <div className="mt-1 text-sm text-gray-800">{promo.title}</div>
                <div className="mt-3 rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm font-semibold text-gray-900">
                  {promo.code}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Valid until {promo.validUntil}
                </p>
                <TrackedAffiliateLink
                  href={href}
                  partner="klook"
                  label={`promo-${promo.code}`}
                  destination={destination}
                  className="mt-3 inline-flex text-sm font-semibold text-orange-700 hover:underline"
                >
                  View eligible bookings
                </TrackedAffiliateLink>
              </div>
            );
          })}
        </div>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-gray-600">
        Affiliate disclosure: Itenora may earn a commission if you book through
        these links, at no extra cost to you. Offers are subject to Klook terms
        and availability.
      </p>
    </section>
  );
}
