import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../constants/tokens';
import { listEvents, type EventSummary } from '../../api/events';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/Avatar';
import Pill from '../../components/Pill';

const FILTERS = ['All', 'Running', 'Food', 'Music', 'Sports', 'Art'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [activeFilter, setActiveFilter] = useState('All');
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listEvents({ pageSize: 20 });
      setEvents(result.items);
    } catch {
      setError('Impossible de charger les événements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filtered = activeFilter === 'All'
    ? events
    : events.filter((e) => e.activityName === activeFilter);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning 👋</Text>
          <Text style={styles.name}>{user?.firstName ?? 'Alex'}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.searchBtn}>
            <Ionicons name="search" size={16} color={T.textMid} />
          </TouchableOpacity>
          <Avatar initials={(user?.firstName ?? 'A')[0]} color={T.coralL} size={36} />
        </View>
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filtersScroll}>
        {FILTERS.map((f) => (
          <Pill key={f} label={f} active={activeFilter === f} onPress={() => setActiveFilter(f)} />
        ))}
      </ScrollView>

      {/* Feed */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.feed}>
        <LinearGradient colors={[T.coral, T.violet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
          <Text style={styles.bannerSub}>📍 Near you · New York</Text>
          <Text style={styles.bannerMain}>{events.length} activités cette semaine</Text>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator color={T.coral} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchEvents}>
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
        <Text style={styles.cardMeta}>📅 {new Date(ev.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
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
