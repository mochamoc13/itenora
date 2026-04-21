"use client";

import React from "react";

type DestinationOption = {
  label: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function formatInputValue(item: DestinationOption) {
  const city = (item.city || "").trim();
  const country = (item.country || "").trim();

  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;
  return item.label;
}

function formatSecondaryLabel(item: DestinationOption) {
  const city = (item.city || "").trim();
  const country = (item.country || "").trim();

  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  return item.label;
}

function createTypedOption(value: string): DestinationOption {
  const trimmed = value.trim();

  return {
    label: trimmed,
    city: trimmed,
  };
}

function hasExactMatch(
  results: DestinationOption[],
  typedValue: string
): boolean {
  const normalizedTyped = normalizeText(typedValue);

  return results.some((item) => {
    const label = normalizeText(item.label || "");
    const city = normalizeText(item.city || "");
    const country = normalizeText(item.country || "");
    const formatted = normalizeText(formatInputValue(item));

    return (
      label === normalizedTyped ||
      city === normalizedTyped ||
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

  if (hasExactMatch(results, trimmed)) {
    return results;
  }

  return [createTypedOption(trimmed), ...results];
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
  const [message, setMessage] = React.useState("");
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
      setMessage("");
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
      setMessage("");
      setHighlightedIndex(-1);
      return;
    }

    if (suppressNextLookupRef.current) {
      suppressNextLookupRef.current = false;
      setOpen(false);
      setLoading(false);
      setResults([]);
      setMessage("");
      setHighlightedIndex(-1);
      return;
    }

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setMessage("");
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
        const nextMessage =
          typeof data?.message === "string" ? data.message : "";

        setResults(nextResults);

        if (apiResults.length === 0 && nextMessage) {
          setMessage(`${nextMessage} Press Enter to use exactly what you typed.`);
        } else if (apiResults.length === 0) {
          setMessage("Press Enter to use exactly what you typed.");
        } else {
          setMessage("");
        }

        setOpen(true);
        setHighlightedIndex(nextResults.length > 0 ? 0 : -1);
      } catch {
        if (currentRequestId !== requestIdRef.current) return;

        const fallbackResults = [createTypedOption(trimmed)];

        setResults(fallbackResults);
        setMessage("Press Enter to use exactly what you typed.");
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

  const showDropdown =
    open && !disabled && (loading || message.length > 0 || results.length > 0);

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
            setMessage("");
          }
        }}
        onFocus={() => {
          if (!disabled && query.trim().length >= 2) {
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
        placeholder="Search city or country (e.g. Tokyo, Bali, London)"
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
            results.map((item, index) => {
              const isTypedOption =
                normalizeText(item.label) === normalizeText(query) &&
                normalizeText(item.city || "") === normalizeText(query) &&
                !(item.country || "").trim();

              const primary = isTypedOption
                ? `Use "${query.trim()}"`
                : (item.city || "").trim() ||
                  (item.country || "").trim() ||
                  item.label;

              const secondary = isTypedOption
                ? "Use exactly what you typed"
                : formatSecondaryLabel(item);

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
                  <div className="text-sm font-medium text-gray-900">
                    {primary}
                  </div>
                  {secondary && secondary !== primary ? (
                    <div className="mt-1 text-xs text-gray-500">
                      {secondary}
                    </div>
                  ) : null}
                </button>
              );
            })}

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