"use client";

import React from "react";

type Props = {
  plan: "plus" | "pro";
  className?: string;
  children: React.ReactNode;
};

export default function PricingButton({ plan, className, children }: Props) {
  const [loading, setLoading] = React.useState(false);

  async function handleCheckout() {
    try {
      setLoading(true);

      const priceId =
        plan === "plus"
          ? process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID
          : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      window.location.href = data.url;
    } catch (err: any) {
      alert(err?.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className={className}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}