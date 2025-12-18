import "../styles/search.scss";
import { useEffect, useRef, useState } from "react";
import { searchLocation } from "../services/geocodingService";
import type { LocationSuggestion } from "../services/types";

interface Props {
  onSelect: (loc: LocationSuggestion) => void;
}

function Search({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const listboxId = "search-results";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const debounced = useDebounce(query, 250);

  useEffect(() => {
    let active = true;
    async function run() {
      if (!debounced) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const found = await searchLocation(debounced);
        if (active) {
          setResults(found);
          setActiveIndex(prev => {
            if (!found.length) return -1;
            const clamped = Math.max(0, Math.min(prev, found.length - 1));
            return clamped;
          });
          console.log('[Search] results loaded:', found.length);
          console.log('[Search] opening list after fetch');
          setOpen(true);
        }
        console.log('test',found);
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [debounced]);

  // Ensure first option becomes active when list opens and results are present
  useEffect(() => {
    if (open && activeIndex < 0 && results.length > 0) {
      setActiveIndex(0);
    }
  }, [open, results.length]);

  // Keep the active option visible
  useEffect(() => {
    if (!open || activeIndex < 0 || activeIndex >= results.length) return;
    const el = document.getElementById(`${listboxId}-option-${results[activeIndex].id}`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, results, listboxId]);

  // Close results on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function handleSelect(item: LocationSuggestion) {
    onSelect(item);
    setQuery(`${item.name}, ${item.admin1 ?? item.country}`);
    setOpen(false);
  }

  return (
    <div className="container" role="search" ref={containerRef}>
      <div className="search-wrapper">
        <div className="search-icon"></div>
        <input role="combobox"
          type="text"
          placeholder="Search for a place..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 && activeIndex < results.length ? `${listboxId}-option-${results[activeIndex].id}` : undefined}
          ref={inputRef}
          onKeyDown={(e) => {
            const len = results.length;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (!open) { console.log('[Search] ArrowDown -> opening list'); setOpen(true); }
              if (len === 0) { console.log('[Search] ArrowDown but no results'); return; }
              setActiveIndex(i => {
                const next = (i < 0 ? 0 : Math.min(i + 1, len - 1));
                console.log('[Search] ArrowDown move', { from: i, to: next, len });
                return next;
              });
              return;
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (len === 0) { console.log('[Search] ArrowUp but no results'); return; }
              setActiveIndex(i => {
                const next = (i < 0 ? len - 1 : Math.max(i - 1, 0));
                console.log('[Search] ArrowUp move', { from: i, to: next, len });
                return next;
              });
              return;
            }
            if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
              e.preventDefault();
              console.log('[Search] Enter select index', activeIndex, results[activeIndex]);
              handleSelect(results[activeIndex]);
              return;
            }
            if (e.key === 'Escape') { console.log('[Search] Escape -> close list'); setOpen(false); setActiveIndex(-1); }
          }}
        />
      </div>
      <button onClick={() => results[0] && handleSelect(results[0])}>Search</button>
      {open && (results.length > 0 || loading) && (
        <ul id={listboxId} className="search-results" role="listbox">
          {loading && <li className="skeleton" style={{ minHeight: "3rem" }} />}
          {!loading &&
            results.map((r, idx) => (
              <li
                id={`${listboxId}-option-${r.id}`}
                key={r.id}
                role="option"
                aria-selected={activeIndex === idx}
                onMouseDown={() => handleSelect(r)}
              >
                <span>{r.name}</span>
                <span>{r.admin1 ? `, ${r.admin1}` : ""}</span>
                <span>{`, ${r.country}`}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function useDebounce<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default Search;
