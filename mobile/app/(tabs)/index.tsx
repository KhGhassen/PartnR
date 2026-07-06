import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { T } from '../../constants/tokens';
import { listEvents, type EventSummary } from '../../api/events';
import { listActivities, type Activity } from '../../api/activities';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/Avatar';
import Pill from '../../components/Pill';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [nearMe, setNearMe] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

  const fetchEvents = useCallback(async (c: { lat: number; lng: number } | null, s: string) => {
    setError('');
    try {
      const result = await listEvents({
        pageSize: 20,
        search: s.trim() || undefined,
        ...(c ? { lat: c.lat, lng: c.lng, radiusKm: 25 } : {}),
      });
      setEvents(result.items);
    } catch {
      setError('Impossible de charger les événements.');
    }
  }, []);

  useEffect(() => {
    listActivities().then(setActivities).catch(() => {});
    fetchEvents(null, '').finally(() => setLoading(false));
  }, [fetchEvents]);

  useEffect(() => () => clearTimeout(searchDebounce.current), []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents(coords, search);
    setRefreshing(false);
  }, [fetchEvents, coords, search]);

  const applySearch = (s: string) => {
    setSearch(s);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchEvents(coords, s), 400);
  };

  const toggleNearMe = useCallback(async () => {
    if (nearMe) {
      setNearMe(false);
      setCoords(null);
      setLoading(true);
      await fetchEvents(null, search);
      setLoading(false);
      return;
    }

    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Autorisez la localisation pour voir les événements près de vous.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setNearMe(true);
      setCoords(c);
      setLoading(true);
      await fetchEvents(c, search);
      setLoading(false);
    } catch {
      setError('Impossible de récupérer votre position.');
    } finally {
      setLocating(false);
    }
  }, [nearMe, fetchEvents, search]);

  const filtered = activeFilter === 'Tous'
    ? events
    : events.filter((e) => e.activityName === activeFilter);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.name}>{user?.firstName ?? ''}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.searchBtn, searchOpen && { backgroundColor: T.coralL }]}
            onPress={() => {
              if (searchOpen && search) applySearch('');
              setSearchOpen((o) => !o);
            }}
          >
            <Ionicons name={searchOpen ? 'close' : 'search'} size={16} color={searchOpen ? T.coralD : T.textMid} />
          </TouchableOpacity>
          <Avatar initials={(user?.firstName ?? 'A')[0]} color={T.coralL} size={36} />
        </View>
      </View>

      {/* Search */}
      {searchOpen && (
        <View style={styles.searchRow}>
          <TextInput
            value={search}
            onChangeText={applySearch}
            placeholder="Rechercher un événement, un lieu…"
            placeholderTextColor={T.textSub}
            autoFocus
            style={styles.searchInput}
          />
        </View>
      )}

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filtersScroll}>
        <Pill
          label={locating ? 'Localisation…' : '📍 Près de moi'}
          active={nearMe}
          onPress={toggleNearMe}
        />
        <Pill label="Tous" active={activeFilter === 'Tous'} onPress={() => setActiveFilter('Tous')} />
        {activities.map((a) => (
          <Pill
            key={a.id}
            label={`${a.icon} ${a.name}`}
            active={activeFilter === a.name}
            onPress={() => setActiveFilter(a.name)}
          />
        ))}
      </ScrollView>

      {/* Feed */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feed}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.coral} />}
      >
        <LinearGradient colors={[T.coral, T.violet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
          <Text style={styles.bannerSub}>📍 {nearMe ? 'Près de vous' : user?.city ?? 'Partout en France'}</Text>
          <Text style={styles.bannerMain}>{events.length} activités cette semaine</Text>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator color={T.coral} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchEvents(coords, search)}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Aucun événement trouvé.</Text>
        ) : (
          filtered.map((ev) => <EventRow key={ev.id} ev={ev} />)
        )}
      </ScrollView>
    </View>
  );
}

function EventRow({ ev }: { ev: EventSummary }) {
  const pct = ev.maxParticipants > 0 ? (ev.participantCount / ev.maxParticipants) * 100 : 0;
  const spotsLeft = ev.maxParticipants - ev.participantCount;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/activity/${ev.id}`)}
      activeOpacity={0.85}
      style={styles.card}
    >
      <View style={[styles.cardBand, { backgroundColor: T.coralL }]}>
        <Text style={styles.cardEmoji}>{ev.activityIcon}</Text>
        <View style={styles.cardTag}>
          <Text style={styles.cardTagText}>{ev.activityName}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{ev.title}</Text>
        <Text style={styles.cardMeta}>
          📅 {new Date(ev.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          {ev.distanceKm != null ? ` · ${ev.distanceKm.toFixed(1)} km` : ''}
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.spots}>{spotsLeft} place{spotsLeft !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.creator}>par {ev.creatorName}</Text>
          <Text style={styles.join}>Rejoindre →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16 },
  greeting: { fontSize: 13, color: T.textSub, fontFamily: 'DMSans_400Regular' },
  name: { fontSize: 20, fontWeight: '700', color: T.text, letterSpacing: -0.5, fontFamily: 'DMSans_700Bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },

  searchRow: { paddingHorizontal: 20, marginTop: 12 },
  searchInput: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: T.border, fontSize: 14, fontFamily: 'DMSans_400Regular', color: T.text, backgroundColor: '#fff' },

  filtersScroll: { flexShrink: 0, marginTop: 14 },
  filters: { paddingHorizontal: 20, gap: 6, paddingBottom: 12 },

  feed: { paddingHorizontal: 20, paddingBottom: 100 },
  banner: { borderRadius: 24, padding: 14, paddingHorizontal: 18, marginBottom: 14 },
  bannerSub:  { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginBottom: 2, fontFamily: 'DMSans_500Medium' },
  bannerMain: { fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'DMSans_600SemiBold' },

  errorBox:  { alignItems: 'center', paddingTop: 40, gap: 8 },
  errorText: { fontSize: 14, color: T.textMid, fontFamily: 'DMSans_400Regular' },
  retryText: { fontSize: 14, color: T.coral, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
  empty:     { textAlign: 'center', color: T.textSub, marginTop: 40, fontFamily: 'DMSans_400Regular' },

  card: { backgroundColor: T.card, borderRadius: 24, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardBand: { height: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  cardEmoji: { fontSize: 32 },
  cardTag: { marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.65)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  cardTagText: { fontSize: 11, fontWeight: '500', color: T.text, fontFamily: 'DMSans_500Medium' },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: T.text, marginBottom: 4, fontFamily: 'DMSans_600SemiBold' },
  cardMeta:  { fontSize: 12, color: T.textSub, marginBottom: 10, fontFamily: 'DMSans_400Regular' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  progressTrack: { flex: 1, height: 4, borderRadius: 4, backgroundColor: T.border, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 4, backgroundColor: T.coral },
  spots: { fontSize: 11, color: T.textMid, fontWeight: '500', fontFamily: 'DMSans_500Medium' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  creator: { fontSize: 12, color: T.textMid, fontFamily: 'DMSans_400Regular' },
  join:    { fontSize: 12, fontWeight: '600', color: T.coral, fontFamily: 'DMSans_600SemiBold' },
});
