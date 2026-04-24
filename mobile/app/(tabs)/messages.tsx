import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../constants/tokens';
import { MESSAGES } from '../../constants/data';
import Avatar from '../../components/Avatar';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.sub}>Your activity chats</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {MESSAGES.map((msg) => {
          const isEmojiAvatar = msg.avatar.length <= 2 && /\p{Emoji}/u.test(msg.avatar);
          return (
            <TouchableOpacity
              key={msg.id}
              onPress={() => router.push(`/chat/${msg.id}`)}
              activeOpacity={0.8}
              style={styles.row}
            >
              <Avatar
                initials={isEmojiAvatar ? undefined : msg.avatar}
                emoji={isEmojiAvatar ? msg.avatar : undefined}
                color={msg.color}
                size={44}
              />
              <View style={styles.info}>
                <View style={styles.topRow}>
                  <Text style={styles.sender}>{msg.sender}</Text>
                  <Text style={styles.time}>{msg.time}</Text>
                </View>
                <Text style={styles.preview} numberOfLines={1}>{msg.preview}</Text>
                <Text style={styles.activity}>#{msg.activity}</Text>
              </View>
              {msg.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{msg.unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    backgroundColor: T.card,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  info: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  sender:   { fontSize: 14, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold' },
  time:     { fontSize: 11, color: T.textSub, fontFamily: 'DMSans_400Regular' },
  preview:  { fontSize: 12, color: T.textSub, fontFamily: 'DMSans_400Regular' },
  activity: { fontSize: 10, color: T.coral, fontWeight: '500', marginTop: 2, fontFamily: 'DMSans_500Medium' },
  badge: {
    backgroundColor: T.coral, borderRadius: 999,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', fontFamily: 'DMSans_700Bold' },
});
