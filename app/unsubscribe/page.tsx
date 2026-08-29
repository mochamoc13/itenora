"use client";

import { useState } from "react";
import Link from "next/link";

export default function UnsubscribePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setStatus(response.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-950">
          Unsubscribe from travel deals
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          This stops optional travel-tip and promotion emails. Your free
          Itenora account and saved trips will remain available.
        </p>

        {status === "done" ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Your unsubscribe request has been recorded.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-semibold text-gray-800">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={status === "saving"}
              className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {status === "saving" ? "Saving..." : "Unsubscribe"}
            </button>
            {status === "error" ? (
              <p className="text-sm text-red-600">
                We could not save the request. Please email support@itenora.com.
              </p>
            ) : null}
          </form>
        )}

        <Link href="/" className="mt-8 inline-flex text-sm font-medium text-gray-700 hover:underline">
          Return to Itenora
        </Link>
      </div>
    </main>
  );
}
