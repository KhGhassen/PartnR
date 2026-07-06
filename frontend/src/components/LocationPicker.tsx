import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../lib/leafletIcons';
import { inputClass } from './ui/classes';

const FRANCE_CENTER: [number, number] = [46.6034, 1.8883];

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView(target, 15);
  }, [target, map]);
  return null;
}

export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const hasPosition = latitude != null && longitude != null;
  const center: [number, number] = hasPosition ? [latitude, longitude] : FRANCE_CENTER;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  }, []);

  const search = (q: string) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    if (q.trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=fr&q=${encodeURIComponent(q)}`,
          { signal: controller.signal, headers: { Accept: 'application/json' } }
        );
        setResults(res.ok ? await res.json() : []);
      } catch {
        // aborted or offline — keep previous results
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const pick = (r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    onChange(lat, lng);
    setFlyTarget([lat, lng]);
    setResults([]);
    setQuery(r.display_name.split(',').slice(0, 2).join(','));
  };

  return (
    <div>
      <div className="relative mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="Rechercher une adresse ou un lieu…"
          className={inputClass(false)}
        />
        {searching && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-sub">Recherche…</span>
        )}
        {results.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-[1200] mt-1 overflow-hidden rounded-2xl border border-line bg-white shadow-card-hover">
            {results.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  className="w-full truncate px-4 py-2.5 text-left text-sm text-ink-mid transition-colors hover:bg-coral-50 hover:text-ink"
                >
                  📍 {r.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border-[1.5px] border-line" style={{ height: 260 }}>
        <MapContainer center={center} zoom={hasPosition ? 13 : 5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={onChange} />
          <FlyTo target={flyTarget} />
          {hasPosition && <Marker position={[latitude, longitude]} />}
        </MapContainer>
      </div>
      <p className="mt-1 text-xs text-ink-sub">
        Cherchez une adresse ou cliquez sur la carte pour positionner l'événement (optionnel)
      </p>
    </div>
  );
}
