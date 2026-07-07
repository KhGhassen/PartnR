import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../constants/tokens';
import { listNotifications, markAllNotificationsRead, type NotificationItem } from '../api/notifications';
import BackBtn from '../components/BackBtn';

const TYPE_ICONS: Record<string, string> = {
  participant_joined: '🎉',
  participant_left: '👋',
  participant_waitlisted: '⏳',
  waitlist_promoted: '✅',
  event_cancelled: '🚫',
  event_reminder: '⏰',
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await listNotifications();
      setItems(data.items);
      if (data.unreadCount > 0) markAllNotificationsRead().catch(() => {});
    } catch {
      // silent
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <BackBtn onPress={() => router.back()} />
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={T.coral} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.coral} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyText}>Aucune notification pour l'instant.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => item.eventId && router.push(`/activity/${item.eventId}`)}
              style={[styles.card, !item.isRead && styles.cardUnread]}
            >
              <Text style={styles.cardIcon}>{TYPE_ICONS[item.type] ?? '🔔'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardMessage}>{item.message}</Text>
                <Text style={styles.cardDate}>
                  {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 12 },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold' },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 14, color: T.textSub, fontFamily: 'DMSans_400Regular' },
  card: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: T.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: T.border,
  },
  cardUnread: { backgroundColor: T.coralL, borderColor: T.coralL },
  cardIcon: { fontSize: 20 },
  cardMessage: { fontSize: 14, color: T.text, fontFamily: 'DMSans_500Medium', marginBottom: 2 },
  cardDate: { fontSize: 12, color: T.textSub, fontFamily: 'DMSans_400Regular' },
});
