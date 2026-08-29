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
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = React.useState(initialValue);
  const [results, setResults] = React.useState<DestinationOption[]>([]);
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    if (disabled) {
      setOpen(false);
      return;
    }

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setMessage("");
      setOpen(false);
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

        const nextResults = Array.isArray(data?.results) ? data.results : [];
        const nextMessage =
          typeof data?.message === "string" ? data.message : "";

        setResults(nextResults);
        setMessage(nextMessage);
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

  const showDropdown =
    open && !disabled && (loading || message.length > 0 || results.length > 0);

  return (
    <div ref={wrapperRef} className="relative z-30">
      <input
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          onChangeText?.(value);

          if (value.trim().length >= 2) {
            setOpen(true);
          } else {
            setOpen(false);
          }
        }}
        onFocus={() => {
          if (!disabled && query.trim().length >= 2) {
            setOpen(true);
          }
        }}
        placeholder="Search a city or country"
        autoComplete="off"
        disabled={disabled}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50"
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
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