import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../lib/leafletIcons';
import { listEvents } from '../api/events';
import Chip from '../components/ui/Chip';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import type { EventSummary } from '../types';

const FRANCE_CENTER: [number, number] = [46.6034, 1.8883];
const RADII = [5, 10, 25, 50];

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function EventsMap() {
  const navigate = useNavigate();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const locateUser = async () => {
    if (!navigator.geolocation) {
      setNotice("La géolocalisation n'est pas disponible sur votre navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNotice('');
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        setNotice('Position indisponible — affichage de tous les événements géolocalisés.');
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const fetchEvents = async (pos: [number, number] | null, radius: number) => {
    setLoading(true);
    try {
      const res = pos
        ? await listEvents({ lat: pos[0], lng: pos[1], radiusKm: radius, pageSize: 100 })
        : await listEvents({ pageSize: 100 });
      setEvents(res.items.filter((e) => e.latitude != null && e.longitude != null));
    } catch {
      setNotice('Erreur lors du chargement des événements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    locateUser();
  }, []);

  useEffect(() => {
    fetchEvents(position, radiusKm);
  }, [position, radiusKm]);

  const center = position ?? FRANCE_CENTER;
  const zoom = position ? 12 : 5;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {position ? 'Événements près de vous' : 'Carte des événements'}
          </h1>
          {notice && <p className="mt-1 text-sm text-ink-sub">{notice}</p>}
        </div>
        {position && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-sub">Rayon</span>
            {RADII.map((r) => (
              <Chip key={r} active={radiusKm === r} onClick={() => setRadiusKm(r)}>
                {r} km
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* List */}
        <div className="order-2 max-h-[560px] space-y-3 overflow-y-auto pr-1 lg:order-1">
          {loading ? (
            <>
              <span className="sr-only">Chargement...</span>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </>
          ) : events.length === 0 ? (
            <EmptyState
              emoji="📍"
              title="Aucun événement dans ce rayon."
              hint={position ? 'Essayez un rayon plus large.' : 'Aucun événement géolocalisé pour le moment.'}
            />
          ) : (
            events.map((ev) => (
              <Link
                key={ev.id}
                to={`/events/${ev.id}`}
                className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral-50 text-2xl">
                  {ev.activityIcon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{ev.title}</p>
                  <p className="truncate text-xs text-ink-sub">
                    {new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{ev.city}
                  </p>
                </div>
                {ev.distanceKm != null && (
                  <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                    {ev.distanceKm.toFixed(1)} km
                  </span>
                )}
              </Link>
            ))
          )}
        </div>

        {/* Map */}
        <div className="order-1 h-[380px] overflow-hidden rounded-3xl border border-line shadow-card lg:order-2 lg:h-[560px]">
          <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
            <Recenter center={center} zoom={zoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {position && (
              <Marker position={position}>
                <Popup>Vous êtes ici</Popup>
              </Marker>
            )}
            {events.map((ev) => (
              <Marker key={ev.id} position={[ev.latitude as number, ev.longitude as number]}>
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold">{ev.activityIcon} {ev.title}</p>
                    <p className="text-xs text-gray-500">
                      {ev.activityName} · {ev.city}
                      {ev.distanceKm != null ? ` · ${ev.distanceKm.toFixed(1)} km` : ''}
                    </p>
                    <button
                      onClick={() => navigate(`/events/${ev.id}`)}
                      className="text-sm font-medium text-coral-600 hover:underline"
                    >
                      Voir l'événement →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
