import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../lib/leafletIcons';
import { listEvents } from '../api/events';
import type { EventSummary } from '../types';

const FRANCE_CENTER: [number, number] = [46.6034, 1.8883];
const DEFAULT_RADIUS_KM = 25;

export default function EventsMap() {
  const navigate = useNavigate();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const locateUser = async () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur votre navigateur.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        setError('Impossible de récupérer votre position. Affichage des événements géolocalisés en France.');
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const fetchNearbyEvents = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await listEvents({ lat, lng, radiusKm: DEFAULT_RADIUS_KM, pageSize: 100 });
      setEvents(res.items);
    } catch {
      setError('Erreur lors du chargement des événements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    locateUser();
  }, []);

  useEffect(() => {
    if (!position) return;
    fetchNearbyEvents(position[0], position[1]);
  }, [position]);

  const center = position ?? FRANCE_CENTER;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Événements près de vous</h1>
      {error && <p className="text-sm text-gray-500 mb-4">{error}</p>}
      {loading && <p className="text-sm text-gray-500 mb-4">Chargement...</p>}

      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 500 }}>
        <MapContainer center={center} zoom={position ? 12 : 5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && (
            <Marker position={position}>
              <Popup>Vous êtes ici</Popup>
            </Marker>
          )}
          {events
            .filter((e) => e.latitude != null && e.longitude != null)
            .map((e) => (
              <Marker key={e.id} position={[e.latitude as number, e.longitude as number]}>
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold">{e.title}</p>
                    <p className="text-xs text-gray-500">
                      {e.activityIcon} {e.activityName} · {e.city}
                    </p>
                    {e.distanceKm != null && (
                      <p className="text-xs text-gray-500">{e.distanceKm.toFixed(1)} km</p>
                    )}
                    <button
                      onClick={() => navigate(`/events/${e.id}`)}
                      className="text-indigo-600 text-sm font-medium hover:underline"
                    >
                      Voir l'événement
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}
