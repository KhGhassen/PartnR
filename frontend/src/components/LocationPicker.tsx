import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../lib/leafletIcons';

const FRANCE_CENTER: [number, number] = [46.6034, 1.8883];

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

export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const hasPosition = latitude != null && longitude != null;
  const center: [number, number] = hasPosition ? [latitude, longitude] : FRANCE_CENTER;

  return (
    <div>
      <div className="rounded-lg overflow-hidden border border-gray-300" style={{ height: 250 }}>
        <MapContainer center={center} zoom={hasPosition ? 13 : 5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={onChange} />
          {hasPosition && <Marker position={[latitude, longitude]} />}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Cliquez sur la carte pour positionner l'événement (optionnel)
      </p>
    </div>
  );
}
