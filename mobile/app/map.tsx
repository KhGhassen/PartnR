import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { T } from '../constants/tokens';
import { listEvents, type EventSummary } from '../api/events';
import BackBtn from '../components/BackBtn';

const FRANCE = { lat: 46.6034, lng: 1.8883, zoom: 5 };

function buildHtml(center: { lat: number; lng: number; zoom: number }, events: EventSummary[], hasUser: boolean) {
  const markers = events
    .filter((e) => e.latitude != null && e.longitude != null)
    .map((e) => ({
      id: e.id,
      lat: e.latitude,
      lng: e.longitude,
      icon: e.activityIcon,
      title: e.title.replace(/"/g, '\\"'),
      sub: `${e.activityName} · ${e.city}${e.distanceKm != null ? ` · ${e.distanceKm.toFixed(1)} km` : ''}`,
    }));

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;height:100%;font-family:sans-serif}</style>
</head><body><div id="map"></div><script>
var map = L.map('map').setView([${center.lat}, ${center.lng}], ${center.zoom});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
${hasUser ? `L.circleMarker([${center.lat}, ${center.lng}], {radius:8,color:'#fff',weight:3,fillColor:'#7B65D4',fillOpacity:1}).addTo(map).bindPopup('Vous êtes ici');` : ''}
var events = ${JSON.stringify(markers)};
events.forEach(function(e){
  var icon = L.divIcon({className:'', html:'<div style="width:38px;height:38px;border-radius:50% 50% 50% 4px;background:#E8603A;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35);border:2px solid #fff"><span style="transform:rotate(45deg);font-size:17px">'+e.icon+'</span></div>', iconSize:[38,38], iconAnchor:[8,34], popupAnchor:[11,-30]});
  L.marker([e.lat, e.lng], {icon: icon}).addTo(map)
    .bindPopup('<b>'+e.icon+' '+e.title+'</b><br><small>'+e.sub+'</small><br><a href="#" onclick="window.ReactNativeWebView.postMessage(\\''+e.id+'\\');return false" style="color:#E8603A;font-weight:600">Voir l\\'événement →</a>');
});
</script></body></html>`;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [html, setHtml] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const load = async () => {
      let center = { ...FRANCE };
      let hasUser = false;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          center = { lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 12 };
          hasUser = true;
        } else {
          setNotice('Position indisponible — affichage de tous les événements.');
        }
      } catch {
        setNotice('Position indisponible — affichage de tous les événements.');
      }

      try {
        const res = hasUser
          ? await listEvents({ lat: center.lat, lng: center.lng, radiusKm: 25, pageSize: 100 })
          : await listEvents({ pageSize: 100 });
        setHtml(buildHtml(center, res.items, hasUser));
      } catch {
        setNotice('Erreur lors du chargement des événements.');
        setHtml(buildHtml(center, [], hasUser));
      }
    };
    load();
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <BackBtn onPress={() => router.back()} />
        <Text style={styles.title}>Autour de vous</Text>
        <View style={{ width: 36 }} />
      </View>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {html ? (
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.map}
          onMessage={(e) => {
            const eventId = e.nativeEvent.data;
            if (eventId) router.push(`/activity/${eventId}`);
          }}
        />
      ) : (
        <ActivityIndicator color={T.coral} style={{ marginTop: 60 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 10 },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold' },
  notice: { fontSize: 12, color: T.textSub, paddingHorizontal: 20, marginBottom: 8, fontFamily: 'DMSans_400Regular' },
  map: { flex: 1, borderRadius: 0 },
});
