import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { T } from '../constants/tokens';
import { type Activity } from '../constants/data';
import Avatar from './Avatar';
import ProgressBar from './ProgressBar';

type Props = {
  act: Activity;
  onPress: () => void;
};

export default function ActivityCard({ act, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      {/* Color band */}
      <View style={[styles.band, { backgroundColor: act.color }]}>
        <Text style={styles.emoji}>{act.emoji}</Text>
        <View style={styles.tags}>
          {act.tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Card body */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{act.title}</Text>
        <View style={styles.dateRow}>
          <Text style={styles.meta}>📅 {act.date}</Text>
        </View>

        <View style={styles.progressRow}>
          <ProgressBar joined={act.joined} total={act.total} />
          <Text style={styles.spots}>
            {act.slots} spot{act.slots !== 1 ? 's' : ''} left
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.hostRow}>
            <Avatar initials={act.hostAvatar} color={act.hostColor} size={22} />
            <Text style={styles.hostText}>by {act.host}</Text>
          </View>
          <Text style={styles.join}>Join →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.card,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  band: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emoji: { fontSize: 36 },
  tags: { marginLeft: 'auto', flexDirection: 'row', gap: 6 },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: { fontSize: 11, fontWeight: '500', color: T.text, fontFamily: 'DMSans_500Medium' },

  body: { padding: 16 },
  title: { fontSize: 14, fontWeight: '600', color: T.text, marginBottom: 4, fontFamily: 'DMSans_600SemiBold' },
  dateRow: { marginBottom: 10 },
  meta: { fontSize: 12, color: T.textSub, fontFamily: 'DMSans_400Regular' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  spots: { fontSize: 11, color: T.textMid, fontWeight: '500', fontFamily: 'DMSans_500Medium', flexShrink: 0 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hostText: { fontSize: 12, color: T.textMid, fontFamily: 'DMSans_400Regular' },
  join: { fontSize: 12, fontWeight: '600', color: T.coral, fontFamily: 'DMSans_600SemiBold' },
});
