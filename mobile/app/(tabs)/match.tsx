import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../constants/tokens';
import { SUGGESTED_PEOPLE, ACTIVITIES } from '../../constants/data';
import Avatar from '../../components/Avatar';
import Pill from '../../components/Pill';
import ActivityCard from '../../components/ActivityCard';
import CTAButton from '../../components/CTAButton';

export default function MatchScreen() {
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState<number[]>([]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>For You</Text>
        <Text style={styles.sub}>Based on your interests</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>PEOPLE NEARBY</Text>

        {SUGGESTED_PEOPLE.filter((p) => !dismissed.includes(p.id)).map((person) => (
          <View key={person.id} style={styles.personCard}>
            <View style={styles.personHeader}>
              <Avatar initials={person.avatar} color={person.color} size={48} />
              <View style={styles.personInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchText}>{person.match}% match</Text>
                  </View>
                </View>
                <Text style={styles.dist}>📍 {person.dist} away</Text>
                <View style={styles.interests}>
                  {person.interests.map((i) => (
                    <Pill key={i} label={i} small />
                  ))}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setDismissed((d) => [...d, person.id])}
                style={styles.dismiss}
              >
                <Text style={styles.dismissX}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.personActions}>
              <View style={{ flex: 1 }}>
                <CTAButton label="View Activities" secondary style={{ paddingVertical: 9 }} />
              </View>
              <View style={{ flex: 1 }}>
                <CTAButton label="Connect" style={{ paddingVertical: 9 }} />
              </View>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 4 }]}>SUGGESTED ACTIVITIES</Text>

        {ACTIVITIES.slice(2, 4).map((act) => (
          <ActivityCard
            key={act.id}
            act={act}
            onPress={() => router.push(`/activity/${act.id}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: T.text, letterSpacing: -0.5, fontFamily: 'DMSans_700Bold' },
  sub:   { fontSize: 13, color: T.textSub, fontFamily: 'DMSans_400Regular' },

  content: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: T.textMid, letterSpacing: 0.8,
    marginBottom: 8, fontFamily: 'DMSans_600SemiBold',
  },

  personCard: {
    backgroundColor: T.card,
    borderRadius: 24,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  personHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  personInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  personName: { fontSize: 15, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold' },
  matchBadge: { backgroundColor: T.coralL, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1 },
  matchText:  { fontSize: 10, fontWeight: '700', color: T.coral, fontFamily: 'DMSans_700Bold' },
  dist:       { fontSize: 12, color: T.textSub, marginBottom: 6, fontFamily: 'DMSans_400Regular' },
  interests:  { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  dismiss:    { padding: 4 },
  dismissX:   { fontSize: 18, color: T.textSub },
  personActions: { flexDirection: 'row', gap: 8 },
});
