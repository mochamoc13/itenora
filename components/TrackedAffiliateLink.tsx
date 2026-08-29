"use client";

import type { ReactNode } from "react";

export default function TrackedAffiliateLink({
  href,
  partner,
  label,
  destination,
  className,
  children,
}: {
  href: string;
  partner: string;
  label: string;
  destination?: string;
  className?: string;
  children: ReactNode;
}) {
  function recordClick() {
    const payload = JSON.stringify({
      partner,
      label,
      destination: destination || "",
      clickedAt: new Date().toISOString(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/affiliate-click",
        new Blob([payload], { type: "application/json" })
      );
      return;
    }

    void fetch("/api/affiliate-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={className}
      onClick={recordClick}
    >
      {children}
    </a>
  );
}
