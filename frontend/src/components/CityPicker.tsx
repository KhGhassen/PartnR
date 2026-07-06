import { useEffect, useRef, useState } from 'react';
import { inputClass } from './ui/classes';

export interface CityResult {
  name: string;
  lat: number | null;
  lng: number | null;
}

interface Commune {
  nom: string;
  centre?: { coordinates: [number, number] };
}

interface CityPickerProps {
  value: string;
  onChange: (city: CityResult) => void;
  placeholder?: string;
  error?: boolean;
}

// Autocomplete over all French communes via the official open API (no key).
export default function CityPicker({ value, onChange, placeholder = 'Votre ville…', error = false }: CityPickerProps) {
  const [query, setQuery] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [results, setResults] = useState<Commune[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  // Sync with the parent value during render (avoids a cascading effect).
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value);
  }

  useEffect(() => () => {
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  }, []);

  const search = (q: string) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,centre&boost=population&limit=6`,
          { signal: controller.signal }
        );
        if (res.ok) {
          setResults(await res.json());
          setOpen(true);
        }
      } catch {
        // offline or aborted — keep previous results
      }
    }, 300);
  };

  const pick = (c: Commune) => {
    setQuery(c.nom);
    setOpen(false);
    onChange({
      name: c.nom,
      lat: c.centre ? c.centre.coordinates[1] : null,
      lng: c.centre ? c.centre.coordinates[0] : null,
    });
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={inputClass(error)}
      />
      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-[1200] mt-1 overflow-hidden rounded-2xl border border-line bg-white shadow-card-hover">
          {results.map((c, i) => (
            <li key={`${c.nom}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(c)}
                className="w-full truncate px-4 py-2.5 text-left text-sm text-ink-mid transition-colors hover:bg-coral-50 hover:text-ink"
              >
                📍 {c.nom}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
