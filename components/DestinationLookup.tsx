"use client";

import React from "react";

type DestinationOption = {
  label: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function formatInputValue(item: DestinationOption) {
  const city = (item.city || "").trim();
  const state = (item.state || "").trim();
  const country = (item.country || "").trim();

  if (city && country) return `${city}, ${country}`;
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (country) return country;
  if (state) return state;
  return item.label;
}

function formatSecondaryLabel(item: DestinationOption) {
  const city = (item.city || "").trim();
  const state = (item.state || "").trim();
  const country = (item.country || "").trim();

  if (city && state && country) return `${city}, ${state}, ${country}`;
  if (city && country) return `${city}, ${country}`;
  if (state && country) return `${state}, ${country}`;
  if (country) return country;
  if (state) return state;
  return item.label;
}

function createTypedOption(value: string): DestinationOption {
  const trimmed = value.trim();

  return {
    label: trimmed,
    city: trimmed,
  };
}

function hasExactMatch(results: DestinationOption[], typedValue: string): boolean {
  const normalizedTyped = normalizeText(typedValue);

  return results.some((item) => {
    const label = normalizeText(item.label || "");
    const city = normalizeText(item.city || "");
    const state = normalizeText(item.state || "");
    const country = normalizeText(item.country || "");
    const formatted = normalizeText(formatInputValue(item));

    return (
      label === normalizedTyped ||
      city === normalizedTyped ||
      state === normalizedTyped ||
      country === normalizedTyped ||
      formatted === normalizedTyped
    );
  });
}

function mergeResultsWithTypedOption(
  results: DestinationOption[],
  typedValue: string
) {
  const trimmed = typedValue.trim();
  if (!trimmed) return results;
  if (hasExactMatch(results, trimmed)) return results;

  return [createTypedOption(trimmed), ...results];
}

function isTypedOption(item: DestinationOption, query: string) {
  const normalizedQuery = normalizeText(query);

  return (
    normalizeText(item.label || "") === normalizedQuery &&
    normalizeText(item.city || "") === normalizedQuery &&
    !(item.state || "").trim() &&
    !(item.country || "").trim()
  );
}

function getBadge(item: DestinationOption) {
  const city = (item.city || "").trim();
  const state = (item.state || "").trim();
  const country = (item.country || "").trim();

  if (city && (state || country)) return "CITY";
  if (!city && country) return "COUNTRY";
  if (!city && state) return "REGION";
  return "CUSTOM";
}

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

  const [query, setQuery] = React.useState(initialValue);
  const [results, setResults] = React.useState<DestinationOption[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);

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
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectItem = React.useCallback(
    (item: DestinationOption) => {
      suppressNextQueryEffectRef.current = true;
      suppressNextLookupRef.current = true;

      const displayValue = formatInputValue(item);

      setQuery(displayValue);
      setResults([]);
      setLoading(false);
      setOpen(false);
      setHighlightedIndex(-1);

      onChangeText?.(displayValue);
      onSelect(item);

      requestAnimationFrame(() => {
        inputRef.current?.blur();
      });
    },
    [onChangeText, onSelect]
  );

  React.useEffect(() => {
    if (disabled) {
      setOpen(false);
      setLoading(false);
      setResults([]);
      setHighlightedIndex(-1);
      return;
    }

    if (suppressNextLookupRef.current) {
      suppressNextLookupRef.current = false;
      setOpen(false);
      setLoading(false);
      setResults([]);
      setHighlightedIndex(-1);
      return;
    }

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      setHighlightedIndex(-1);
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

        const apiResults = Array.isArray(data?.results) ? data.results : [];
        const nextResults = mergeResultsWithTypedOption(apiResults, trimmed);

        setResults(nextResults.slice(0, 6));
        setOpen(nextResults.length > 0);
        setHighlightedIndex(nextResults.length > 0 ? 0 : -1);
      } catch {
        if (currentRequestId !== requestIdRef.current) return;

        const fallbackResults = [createTypedOption(trimmed)];

        setResults(fallbackResults);
        setOpen(true);
        setHighlightedIndex(0);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, disabled]);

  const showDropdown = open && !disabled && (loading || results.length > 0);

  return (
    <div ref={wrapperRef} className="relative z-30">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          setHighlightedIndex(-1);
          onChangeText?.(value);

          if (value.trim().length >= 2) {
            setOpen(true);
          } else {
            setOpen(false);
            setResults([]);
          }
        }}
        onFocus={() => {
          if (!disabled && query.trim().length >= 2 && results.length > 0) {
            setOpen(true);
          }
        }}
        onKeyDown={(e) => {
          const trimmed = query.trim();

          if (e.key === "ArrowDown") {
            if (!showDropdown || results.length === 0) return;
            e.preventDefault();
            setHighlightedIndex((prev) =>
              prev < results.length - 1 ? prev + 1 : prev
            );
            return;
          }

          if (e.key === "ArrowUp") {
            if (!showDropdown || results.length === 0) return;
            e.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
            return;
          }

          if (e.key === "Escape") {
            setOpen(false);
            setHighlightedIndex(-1);
            return;
          }

          if (e.key !== "Enter") return;
          if (!trimmed) return;

          e.preventDefault();

          if (
            showDropdown &&
            results.length > 0 &&
            highlightedIndex >= 0 &&
            highlightedIndex < results.length
          ) {
            selectItem(results[highlightedIndex]);
            return;
          }

          selectItem(createTypedOption(trimmed));
        }}
        placeholder="Search city or country"
        autoComplete="off"
        disabled={disabled}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50"
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Looking up destinations...
            </div>
          )}

          {!loading &&
            results.map((item, index) => {
              const typed = isTypedOption(item, query);

              const primary = typed
                ? `Use "${query.trim()}"`
                : (item.city || "").trim() ||
                  (item.country || "").trim() ||
                  (item.state || "").trim() ||
                  item.label;

              const secondary = typed
                ? "Use exactly what you typed"
                : formatSecondaryLabel(item);

              const badge = typed ? "CUSTOM" : getBadge(item);

              return (
                <button
                  key={`${item.label}-${index}`}
                  type="button"
                  className={`block w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 ${
                    highlightedIndex === index ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectItem(item);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {primary}
                      </div>
                      {secondary && secondary !== primary ? (
                        <div className="mt-1 truncate text-xs text-gray-500">
                          {secondary}
                        </div>
                      ) : null}
                    </div>

                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-600">
                      {badge}
                    </span>
                  </div>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}