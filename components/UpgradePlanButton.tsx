"use client";

type UpgradePlanButtonProps = {
  plan: "plus" | "pro";
  label: string;
};

export default function UpgradePlanButton({
  plan,
  label,
}: UpgradePlanButtonProps) {
  async function handleUpgrade() {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error("Unable to start checkout");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Failed to start checkout.");
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      className="mt-3 inline-flex rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
    >
      {label}
    </button>
  );
}