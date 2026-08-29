# Itenora

Itenora is a free AI travel itinerary planner built with Next.js, Clerk,
Supabase and OpenAI. Members can create up to 10 itineraries per month, with a
three-per-day safeguard.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the Clerk, Supabase, OpenAI and affiliate credentials.
3. Install dependencies with `npm install`.
4. Start the app with `npm run dev`.

Never commit or share `.env.local`.

## Free membership model

- A verified Clerk account is required before generation.
- Planner details are carried through the sign-in redirect.
- The monthly generation allowance is stored in `user_usage`.
- A daily count is calculated from the `itineraries` table.
- Stripe subscription checkout is disabled.

## Optional marketing emails

The planner includes a separate, unticked travel-deals consent checkbox. When
selected, the verified Clerk email, consent time and source are sent through
`GSHEETS_WEBAPP_URL`. Generation still works if logging is unavailable.

The public `/unsubscribe` page records opt-out requests through the same
endpoint. Any email platform used to send promotions must honour those requests
and include the unsubscribe URL.

## Klook promotions

Affiliate redirects use `NEXT_PUBLIC_KLOOK_AID`. Current promotional codes can
be added to `data/klook-promos.ts`; the website automatically hides expired or
irrelevant entries. Do not add codes unless they are authorised for affiliate
promotion.

Affiliate clicks from the Klook deals panel are logged through
`GSHEETS_WEBAPP_URL` when it is configured.

## Optional contributions

Create a Stripe Payment Link using **Customers choose what to pay**, then set
its URL as `NEXT_PUBLIC_STRIPE_SUPPORT_URL`. The Support Itenora panels remain
hidden until this variable is configured.

## Search privacy

Only slugs listed in `INDEXABLE_TRIP_SLUGS` appear in the sitemap or receive
index/follow metadata. Other shared itinerary URLs remain usable but are marked
noindex, and unrelated private trips are not recommended from them.

## Validation

```bash
npm run build
```
