import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../constants/tokens';
import { listEvents, type EventSummary } from '../../api/events';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listEvents({ status: 'Published', pageSize: 30 })
      .then((r) => setEvents(r.items))
      .catch(() => setError('Impossible de charger les événements.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.sub}>Chats des événements</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={T.coral} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {events.map((ev) => (
            <TouchableOpacity
              key={ev.id}
              onPress={() => router.push(`/chat/${ev.id}`)}
              activeOpacity={0.8}
              style={styles.row}
            >
              <View style={[styles.iconBox, { backgroundColor: T.coralL }]}>
                <Text style={styles.icon}>{ev.activityIcon}</Text>
              </View>
              <View style={styles.info}>
                <View style={styles.topRow}>
                  <Text style={styles.sender} numberOfLines={1}>{ev.title}</Text>
                  <Text style={styles.time}>
                    {new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <Text style={styles.preview}>📍 {ev.city} · {ev.participantCount}/{ev.maxParticipants} participants</Text>
                <Text style={styles.activity}>#{ev.activityName}</Text>
              </View>
              <View style={[styles.dot, { opacity: ev.status === 'Published' ? 1 : 0 }]} />
            </TouchableOpacity>
          ))}
          {events.length === 0 && (
            <Text style={styles.empty}>Aucun événement disponible.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title:  { fontSize: 20, fontWeight: '700', color: T.text, letterSpacing: -0.5, fontFamily: 'DMSans_700Bold' },
  sub:    { fontSize: 13, color: T.textSub, fontFamily: 'DMSans_400Regular' },

  list: { paddingHorizontal: 20, paddingBottom: 100 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, paddingHorizontal: 14,
    backgroundColor: T.card, borderRadius: 16, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  icon:    { fontSize: 22 },
  info:    { flex: 1, minWidth: 0 },
  topRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  sender:  { fontSize: 14, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold', flex: 1, marginRight: 8 },
  time:    { fontSize: 11, color: T.textSub, fontFamily: 'DMSans_400Regular' },
  preview: { fontSize: 12, color: T.textSub, fontFamily: 'DMSans_400Regular' },
  activity:{ fontSize: 10, color: T.coral, fontWeight: '500', marginTop: 2, fontFamily: 'DMSans_500Medium' },
  dot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: T.coral },
  errorText:{ textAlign: 'center', color: T.textMid, marginTop: 40, fontFamily: 'DMSans_400Regular' },
  empty:   { textAlign: 'center', color: T.textSub, marginTop: 40, fontFamily: 'DMSans_400Regular' },
});
