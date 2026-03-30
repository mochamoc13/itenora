"use client";

import React from "react";

type DestinationOption = {
  label: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
};

export default function DestinationLookup({
  initialValue = "",
  disabled = false,
  onSelect,
  onChangeText,
}: {
  initialValue?: string;
  disabled?: boolean;
  onSelect: (item: DestinationOption) => void;
  onChangeText?: (value: string) => void;
}) {
  const [query, setQuery] = React.useState(initialValue);
  const [results, setResults] = React.useState<DestinationOption[]>([]);
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    if (disabled) {
      setOpen(false);
      return;
    }

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setMessage("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/destination-lookup?q=${encodeURIComponent(trimmed)}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        setResults(Array.isArray(data?.results) ? data.results : []);
        setMessage(typeof data?.message === "string" ? data.message : "");
        setOpen(true);
      } catch {
        setResults([]);
        setMessage("Could not load destination suggestions.");
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, disabled]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          setOpen(true);
          onChangeText?.(value);
        }}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        placeholder="Tokyo, Singapore, Bali..."
        disabled={disabled}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50"
      />

      {open && !disabled && (loading || message || results.length > 0) && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Looking up destinations...
            </div>
          )}

          {!loading && message && (
            <div className="px-4 py-3 text-sm text-amber-700">{message}</div>
          )}

          {!loading &&
            results.map((item, index) => (
              <button
                key={`${item.label}-${index}`}
                type="button"
                className="block w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
                onClick={() => {
                  setQuery(item.label);
                  setResults([]);
                  setMessage("");
                  setOpen(false);
                  onSelect(item);
                }}
              >
                <div className="text-sm font-medium text-gray-900">
                  {item.city || item.country || item.label}
                </div>
                <div className="mt-1 text-xs text-gray-500">{item.label}</div>
              </button>
            ))}

          {!loading && !message && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-4 py-3 text-sm text-gray-500">
              No matching destinations found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}