"use client";

type PricingButtonProps = {
  plan: "plus" | "pro";
  label: string;
};

export default function PricingButton({ plan, label }: PricingButtonProps) {
  async function handleClick() {
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
      onClick={handleClick}
      className="inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-black"
    >
      {label}
    </button>
  );
}