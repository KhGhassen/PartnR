import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../constants/tokens';
import { ACTIVITIES } from '../../constants/data';
import { useApp } from '../../context/AppContext';
import Pill from '../../components/Pill';
import CTAButton from '../../components/CTAButton';

const MY_INTERESTS = ['Running', 'Hiking', 'Jazz', 'Food', 'Photography', 'Travel'];
const BADGES = [
  { icon: '⭐', label: 'Verified', bg: '#F5EAB0' },
  { icon: '🔥', label: 'Active',   bg: '#F5D5C0' },
  { icon: '🤝', label: 'Host',     bg: '#E0D9F5' },
];
const STATS: [string, string][] = [['12', 'Activities'], ['8', 'Friends'], ['4.9', 'Rating']];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { userName } = useApp();
  const displayName = userName || 'Alex';

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      {/* Gradient header */}
      <LinearGradient
        colors={[T.coral, T.violet]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + 24 }]}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{displayName[0]}J</Text>
        </View>
        <Text style={styles.profileName}>{displayName} Johnson</Text>
        <Text style={styles.profileMeta}>📍 New York · Joined Apr 2025</Text>
        <View style={styles.badgeRow}>
          {BADGES.map((b) => (
            <View key={b.label} style={[styles.badge, { backgroundColor: b.bg }]}>
              <Text style={styles.badgeText}>{b.icon} {b.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={[styles.content, { paddingBottom: insets.bottom + 80 }]}>
        {/* Stats card */}
        <View style={styles.statsCard}>
          {STATS.map(([num, label]) => (
            <View key={label} style={styles.statItem}>
              <Text style={styles.statNum}>{num}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestRow}>
            {MY_INTERESTS.map((i) => (
              <Pill key={i} label={i} active small />
            ))}
          </View>
        </View>

        {/* Upcoming activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming activities</Text>
          {ACTIVITIES.slice(0, 2).map((act) => (
            <View key={act.id} style={styles.activityRow}>
              <View style={[styles.activityIcon, { backgroundColor: act.color }]}>
                <Text style={{ fontSize: 16 }}>{act.emoji}</Text>
              </View>
              <View>
                <Text style={styles.activityTitle}>{act.title}</Text>
                <Text style={styles.activityDate}>{act.date.split('·')[0].trim()}</Text>
              </View>
            </View>
          ))}
        </View>

        <CTAButton label="Edit Profile" secondary />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },

  gradientHeader: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInitial: { fontSize: 28, fontWeight: '700', color: '#fff', fontFamily: 'DMSans_700Bold' },
  profileName:   { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 2, fontFamily: 'DMSans_700Bold' },
  profileMeta:   { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: 'DMSans_400Regular' },
  badgeRow:      { flexDirection: 'row', gap: 6, marginTop: 10 },
  badge:         { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, flexDirection: 'row', gap: 4 },
  badgeText:     { fontSize: 11, fontWeight: '500', color: T.text, fontFamily: 'DMSans_500Medium' },

  content: { paddingHorizontal: 20, marginTop: -16 },

  statsCard: {
    backgroundColor: T.card,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  statItem:  { flex: 1, alignItems: 'center' },
  statNum:   { fontSize: 20, fontWeight: '700', color: T.coral, fontFamily: 'DMSans_700Bold' },
  statLabel: { fontSize: 11, color: T.textSub, fontFamily: 'DMSans_400Regular' },

  section:      { backgroundColor: T.card, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: T.text, marginBottom: 10, fontFamily: 'DMSans_600SemiBold' },
  interestRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  activityRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  activityIcon:  { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontSize: 12, fontWeight: '500', color: T.text, fontFamily: 'DMSans_500Medium' },
  activityDate:  { fontSize: 11, color: T.textSub, fontFamily: 'DMSans_400Regular' },
});
