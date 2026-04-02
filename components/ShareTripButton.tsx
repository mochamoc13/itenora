"use client";

import { useState } from "react";

export default function ShareTripButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `https://itenora.com/trips/share/${slug}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My trip itinerary ✈️",
          text: "I planned this trip in seconds using AI 🤯",
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      window.open(shareUrl, "_blank");
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
    >
      {copied ? "Link copied!" : "Share trip"}
    </button>
  );
}