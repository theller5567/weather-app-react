import "../styles/search.scss";
import { useEffect, useState } from "react";
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
        if (active) setResults(found);
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

  function handleSelect(item: LocationSuggestion) {
    onSelect(item);
    setQuery(`${item.name}, ${item.admin1 ?? item.country}`);
    setOpen(false);
  }

  return (
    <div className="container" role="search">
      <div className="search-wrapper">
        <div className="search-icon"></div>
        <input
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
        />
      </div>
      <button onClick={() => results[0] && handleSelect(results[0])}>Search</button>
      {open && (results.length > 0 || loading) && (
        <ul className="search-results" role="listbox">
          {loading && <li className="skeleton" style={{ minHeight: "3rem" }} />}
          {!loading &&
            results.map((r) => (
              <li key={r.id} role="option" onMouseDown={() => handleSelect(r)}>
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
