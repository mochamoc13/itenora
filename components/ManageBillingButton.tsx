"use client";

export default function ManageBillingButton() {
  return (
    <button
      onClick={async () => {
        try {
          const res = await fetch("/api/stripe/portal", {
            method: "POST",
          });

          const data = await res.json();

          if (!res.ok || !data.url) {
            throw new Error("Unable to open billing portal");
          }

          window.location.href = data.url;
        } catch (err) {
          console.error(err);
          alert("Failed to open billing portal.");
        }
      }}
      className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
    >
      Manage billing
    </button>
  );
}