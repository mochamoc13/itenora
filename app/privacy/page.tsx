import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <article className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-950">
          Privacy notice
        </h1>
        <p className="mt-3 text-sm text-gray-500">Last updated: 29 August 2026</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Information Itenora uses</h2>
            <p className="mt-2">
              Itenora uses your account email, the trip details you enter, saved
              itineraries and basic service-usage information to provide and
              protect the trip-planning service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Optional travel emails</h2>
            <p className="mt-2">
              Travel tips, deals and promo-code emails are optional. They are
              sent only when you select the separate consent box, and you can
              unsubscribe at any time without losing your account or trips.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Affiliate links</h2>
            <p className="mt-2">
              Some hotel and activity links are affiliate links. Itenora may
              receive a commission after an eligible booking, at no extra cost
              to you. Click events may be recorded to understand which travel
              recommendations are useful.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Your choices</h2>
            <p className="mt-2">
              To unsubscribe from promotional emails, use the link in any
              marketing email or the unsubscribe page. For questions, account
              data requests or deletion requests, email support@itenora.com.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm font-medium">
          <Link href="/unsubscribe" className="text-purple-700 hover:underline">
            Unsubscribe from travel emails
          </Link>
          <Link href="/" className="text-gray-700 hover:underline">
            Return to Itenora
          </Link>
        </div>
      </article>
    </main>
  );
}
