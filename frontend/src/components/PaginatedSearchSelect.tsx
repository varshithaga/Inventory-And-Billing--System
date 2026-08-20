import { useEffect, useRef, useState, type ReactNode, type UIEvent } from "react";
import type { PaginatedResponse } from "../types";

interface PaginatedSearchSelectProps<T> {
  /** Currently selected item, or null for "nothing selected". Controlled by the parent. */
  selected: T | null;
  onSelect: (item: T | null) => void;
  /**
   * Must be a stable function reference (e.g. an api.ts export imported
   * directly) — it's intentionally left out of this component's effect
   * deps, so an inline arrow function here would cause stale closures.
   */
  fetchPage: (search: string, page: number) => Promise<PaginatedResponse<T>>;
  getId: (item: T) => string | number;
  getLabel: (item: T) => string;
  renderOption?: (item: T) => ReactNode;
  placeholder?: string;
  /** Show a "clear selection" option/button. Default true. */
  allowClear?: boolean;
  /** After picking an item, clear the search box instead of showing its label — for "search to add" flows like the billing product picker. */
  clearOnSelect?: boolean;
  className?: string;
  inputClassName?: string;
}

export default function PaginatedSearchSelect<T>({
  selected,
  onSelect,
  fetchPage,
  getId,
  getLabel,
  renderOption,
  placeholder = "Search...",
  allowClear = true,
  clearOnSelect = false,
  className = "",
  inputClassName = "",
}: PaginatedSearchSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetchPage(debouncedQuery, 1).then((res) => {
      if (cancelled) return;
      setItems(res.results);
      setPage(res.current_page);
      setHasNext(res.next !== null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // fetchPage is expected to be a stable reference — see prop doc above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadMore = () => {
    if (loading || !hasNext) return;
    setLoading(true);
    fetchPage(debouncedQuery, page + 1).then((res) => {
      setItems((prev) => [...prev, ...res.results]);
      setPage(res.current_page);
      setHasNext(res.next !== null);
      setLoading(false);
    });
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      loadMore();
    }
  };

  const handleFocus = () => {
    setOpen(true);
    setInputValue("");
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    if (clearOnSelect) {
      setInputValue("");
      setDebouncedQuery("");
    } else {
      setInputValue(getLabel(item));
      setOpen(false);
    }
  };

  const handleClear = () => {
    onSelect(null);
    setInputValue("");
    setOpen(false);
  };

  const displayValue = open ? inputValue : selected ? getLabel(selected) : "";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          value={displayValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleFocus}
          placeholder={selected ? getLabel(selected) : placeholder}
          className={inputClassName}
          style={allowClear && selected && !open ? { paddingRight: "2.25rem" } : undefined}
        />
        {allowClear && selected && !open && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-2.5 flex items-center text-violet-400 hover:text-rose-600 transition"
            title="Clear"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div
          onScroll={handleScroll}
          className="absolute z-30 mt-2 w-full bg-white border border-violet-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-violet-100"
        >
          {allowClear && !clearOnSelect && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full text-left px-4 py-2.5 text-xs font-bold text-violet-500 hover:bg-violet-50/70 transition italic"
            >
              {placeholder}
            </button>
          )}
          {items.map((item) => (
            <button
              key={getId(item)}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-violet-50/70 transition"
            >
              {renderOption ? renderOption(item) : getLabel(item)}
            </button>
          ))}
          {loading && <div className="px-4 py-3 text-xs font-semibold text-violet-400">Loading…</div>}
          {!loading && items.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-violet-400 italic">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
}
