import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../constants/tokens';
import { listEvents, type EventSummary } from '../../api/events';
import { getProfile } from '../../api/profiles';
import { useApp } from '../../context/AppContext';

export default function MatchScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();

  const [suggested, setSuggested] = useState<EventSummary[]>([]);
  const [other, setOther] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [eventsRes, profile] = await Promise.all([
        listEvents({ pageSize: 50 }),
        user ? getProfile(user.id).catch(() => null) : Promise.resolve(null),
      ]);

      const favorites: string[] = profile?.favoriteActivities ?? [];
      const favSet = new Set(favorites.map((f) => f.toLowerCase()));

      const items = eventsRes.items;
      if (favSet.size > 0) {
        setSuggested(items.filter((e) => favSet.has(e.activityName.toLowerCase())));
        setOther(items.filter((e) => !favSet.has(e.activityName.toLowerCase())));
      } else {
        setSuggested([]);
        setOther(items);
      }
      setError('');
    } catch {
      setError('Impossible de charger les suggestions.');
    }
  }, [user]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Pour vous</Text>
        <Text style={styles.sub}>Basé sur vos activités</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={T.coral} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.coral} />}
        >
          {suggested.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>VOS ACTIVITÉS</Text>
              {suggested.map((ev) => <EventRow key={ev.id} ev={ev} highlighted />)}
            </>
          )}

          {other.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, suggested.length > 0 && { marginTop: 16 }]}>
                {suggested.length > 0 ? 'AUTRES ÉVÉNEMENTS' : 'ÉVÉNEMENTS DISPONIBLES'}
              </Text>
              {other.map((ev) => <EventRow key={ev.id} ev={ev} />)}
            </>
          )}

          {suggested.length === 0 && other.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>Aucun événement pour l'instant</Text>
              <Text style={styles.emptySub}>Revenez plus tard ou créez le vôtre !</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function EventRow({ ev, highlighted = false }: { ev: EventSummary; highlighted?: boolean }) {
  const isFull = ev.participantCount >= ev.maxParticipants;
  return (
    <TouchableOpacity
      onPress={() => router.push(`/activity/${ev.id}`)}
      activeOpacity={0.8}
      style={[styles.card, highlighted && styles.cardHighlighted]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.iconBox, { backgroundColor: highlighted ? T.coral : T.coralL }]}>
          <Text style={styles.icon}>{ev.activityIcon}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{ev.title}</Text>
          <Text style={styles.cardSub}>📍 {ev.city}</Text>
        </View>
        <View style={[styles.spotsBox, isFull && styles.spotsBoxFull]}>
          <Text style={[styles.spotsText, isFull && styles.spotsTextFull]}>
            {isFull ? 'Complet' : `${ev.maxParticipants - ev.participantCount} places`}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.activityPill}>#{ev.activityName}</Text>
        <Text style={styles.date}>
          {new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title:  { fontSize: 20, fontWeight: '700', color: T.text, letterSpacing: -0.5, fontFamily: 'DMSans_700Bold' },
  sub:    { fontSize: 13, color: T.textSub, fontFamily: 'DMSans_400Regular' },

  content: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: T.textMid, letterSpacing: 0.8,
    marginBottom: 10, fontFamily: 'DMSans_600SemiBold',
  },
  errorText: { textAlign: 'center', color: T.textMid, marginTop: 40, fontFamily: 'DMSans_400Regular' },

  card: {
    backgroundColor: T.card, borderRadius: 18, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHighlighted: { borderWidth: 1.5, borderColor: T.coral + '40' },
  cardTop:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  iconBox:   { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  icon:      { fontSize: 20 },
  cardInfo:  { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold' },
  cardSub:   { fontSize: 12, color: T.textSub, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  spotsBox:     { backgroundColor: T.coralL, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  spotsBoxFull: { backgroundColor: T.border },
  spotsText:    { fontSize: 10, fontWeight: '600', color: T.coral, fontFamily: 'DMSans_600SemiBold' },
  spotsTextFull:{ color: T.textMid },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityPill:{ fontSize: 11, color: T.coral, fontWeight: '500', fontFamily: 'DMSans_500Medium' },
  date:        { fontSize: 11, color: T.textSub, fontFamily: 'DMSans_400Regular' },

  emptyBox:  { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle:{ fontSize: 15, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold', marginBottom: 6 },
  emptySub:  { fontSize: 13, color: T.textSub, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 19 },
});
