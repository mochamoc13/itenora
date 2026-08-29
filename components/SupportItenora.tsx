export default function SupportItenora({ compact = false }: { compact?: boolean }) {
  const supportUrl = process.env.NEXT_PUBLIC_STRIPE_SUPPORT_URL?.trim();

  if (!supportUrl) return null;

  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-purple-200 bg-purple-50 p-5"
          : "rounded-3xl border border-purple-200 bg-purple-50 p-8 shadow-sm"
      }
    >
      <h2 className={compact ? "text-lg font-semibold" : "text-2xl font-semibold"}>
        Enjoying Itenora?
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-700">
        Itenora is free to use. If it helped with your trip, you can make an
        optional contribution to help cover AI and hosting costs.
      </p>
      <a
        href={supportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800"
      >
        Support Itenora
      </a>
    </div>
  );
}
