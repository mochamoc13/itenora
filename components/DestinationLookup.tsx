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
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const requestIdRef = React.useRef(0);
  const suppressNextQueryEffectRef = React.useRef(false);
  const suppressNextLookupRef = React.useRef(false);
  const autoSelectTimerRef = React.useRef<number | null>(null);

  const [query, setQuery] = React.useState(initialValue);
  const [results, setResults] = React.useState<DestinationOption[]>([]);
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (suppressNextQueryEffectRef.current) {
      suppressNextQueryEffectRef.current = false;
      return;
    }

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

  const clearAutoSelectTimer = React.useCallback(() => {
    if (autoSelectTimerRef.current !== null) {
      window.clearTimeout(autoSelectTimerRef.current);
      autoSelectTimerRef.current = null;
    }
  }, []);

  const selectItem = React.useCallback(
    (item: DestinationOption) => {
      clearAutoSelectTimer();

      suppressNextQueryEffectRef.current = true;
      suppressNextLookupRef.current = true;

      setQuery(item.label);
      setResults([]);
      setMessage("");
      setLoading(false);
      setOpen(false);

      onSelect(item);

      requestAnimationFrame(() => {
        inputRef.current?.blur();
      });
    },
    [clearAutoSelectTimer, onSelect]
  );

  React.useEffect(() => {
    if (disabled) {
      setOpen(false);
      setLoading(false);
      clearAutoSelectTimer();
      return;
    }

    if (suppressNextLookupRef.current) {
      suppressNextLookupRef.current = false;
      setOpen(false);
      setLoading(false);
      setResults([]);
      setMessage("");
      clearAutoSelectTimer();
      return;
    }

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setMessage("");
      setOpen(false);
      setLoading(false);
      clearAutoSelectTimer();
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/destination-lookup?q=${encodeURIComponent(trimmed)}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (currentRequestId !== requestIdRef.current) return;

        const nextResults = Array.isArray(data?.results) ? data.results : [];
        const nextMessage =
          typeof data?.message === "string" ? data.message : "";

        setResults(nextResults);
        setMessage(nextMessage);
        setOpen(true);

        clearAutoSelectTimer();

        // Auto-select the first strong match after a short pause
        if (
          nextResults.length > 0 &&
          trimmed.length >= 3 &&
          !nextMessage
        ) {
          autoSelectTimerRef.current = window.setTimeout(() => {
            const first = nextResults[0];
            if (!first) return;

            const firstCity = (first.city || "").trim().toLowerCase();
            const firstLabel = (first.label || "").trim().toLowerCase();
            const q = trimmed.toLowerCase();

            const strongMatch =
              firstCity === q ||
              firstLabel === q ||
              firstCity.startsWith(q);

            if (strongMatch) {
              selectItem(first);
            }
          }, 500);
        }
      } catch {
        if (currentRequestId !== requestIdRef.current) return;

        setResults([
          {
            label: trimmed,
            city: trimmed,
          },
        ]);
        setMessage("Press enter to use this destination");
        setOpen(true);
        clearAutoSelectTimer();
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      clearAutoSelectTimer();
    };
  }, [query, disabled, clearAutoSelectTimer, selectItem]);

  const showDropdown =
    open && !disabled && (loading || message.length > 0 || results.length > 0);

  return (
    <div ref={wrapperRef} className="relative z-30">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          clearAutoSelectTimer();
          setQuery(value);
          onChangeText?.(value);

          if (value.trim().length >= 2) {
            setOpen(true);
          } else {
            setOpen(false);
            setResults([]);
            setMessage("");
          }
        }}
        onFocus={() => {
          if (!disabled && query.trim().length >= 2) {
            setOpen(true);
          }
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;

          const trimmed = query.trim();
          if (!trimmed) return;

          e.preventDefault();
          clearAutoSelectTimer();

          if (results.length > 0) {
            selectItem(results[0]);
            return;
          }

          selectItem({
            label: trimmed,
            city: trimmed,
          });
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  clearAutoSelectTimer();
                  selectItem(item);
                }}
              >
                <div className="text-sm font-medium text-gray-900">
                  {item.city || item.country || item.label}
                </div>
                <div className="mt-1 text-xs text-gray-500">{item.label}</div>
              </button>
            ))}

          {!loading &&
            !message &&
            results.length === 0 &&
            query.trim().length >= 2 && (
              <div className="px-4 py-3 text-sm text-gray-500">
                No matching destinations found.
              </div>
            )}
        </div>
      )}
    </div>
  );
}