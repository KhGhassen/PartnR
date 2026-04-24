import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../constants/tokens';
import { ACTIVITIES, AVATAR_COLORS } from '../../constants/data';
import Avatar from '../../components/Avatar';
import BackBtn from '../../components/BackBtn';
import Pill from '../../components/Pill';
import ProgressBar from '../../components/ProgressBar';
import CTAButton from '../../components/CTAButton';

const PARTICIPANT_INITIALS = ['MR', 'LM', 'SK', 'RJ', 'AT', 'DS', 'PK'];

export default function ActivityDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const act = ACTIVITIES.find((a) => String(a.id) === id);

  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  if (!act) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Text style={styles.notFound}>Activity not found.</Text>
      </View>
    );
  }

  const participants = Array.from({ length: act.joined }, (_, i) => ({
    initials: PARTICIPANT_INITIALS[i % PARTICIPANT_INITIALS.length],
    color: AVATAR_COLORS[PARTICIPANT_INITIALS[i % PARTICIPANT_INITIALS.length]] ?? T.coralL,
  }));

  const handleJoin = () => {
    if (joined || joining) return;
    setJoining(true);
    setTimeout(() => { setJoining(false); setJoined(true); }, 1000);
  };

  return (
    <View style={styles.screen}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: act.color, paddingTop: insets.top + 12 }]}>
        <Text style={styles.heroEmoji}>{act.emoji}</Text>
        <View style={styles.heroTop}>
          <BackBtn onPress={() => router.back()} />
          <TouchableOpacity style={styles.shareBtn}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.tagsRow}>
          {act.tags.map((t) => <Pill key={t} label={t} small />)}
        </View>
        <Text style={styles.title}>{act.title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>📅 {act.date}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>📍 {act.location}</Text>
        </View>

        {/* Map placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapLabel}>map · {act.location}</Text>
        </View>

        {/* Participants */}
        <Text style={styles.sectionTitle}>Participants ({act.joined}/{act.total})</Text>
        <ProgressBar joined={act.joined} total={act.total} />
        <View style={styles.avatarRow}>
          {participants.map((p, i) => (
            <Avatar key={i} initials={p.initials} color={p.color} size={32} />
          ))}
          <View style={styles.addSlot}>
            <Text style={styles.addSlotText}>+</Text>
          </View>
        </View>

        {/* Host */}
        <View style={styles.hostCard}>
          <Avatar initials={act.hostAvatar} color={act.hostColor} size={38} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hostedBy}>Hosted by</Text>
            <Text style={styles.hostName}>{act.host}</Text>
          </View>
          <TouchableOpacity style={styles.messageBtn}>
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 12 }]}>
        <CTAButton
          label={joined ? '✓ You joined!' : joining ? 'Joining…' : `Join Activity · ${act.slots} spots left`}
          onPress={handleJoin}
          style={joined ? { backgroundColor: '#5BAF80' } : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  notFound: { padding: 20, color: T.textMid, textAlign: 'center', fontFamily: 'DMSans_400Regular' },

  hero: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroEmoji: { fontSize: 64 },
  heroTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  shareBtn: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  shareText: { fontSize: 12, fontWeight: '500', color: T.text, fontFamily: 'DMSans_500Medium' },

  content: { paddingHorizontal: 20, paddingTop: 20 },
  tagsRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  title: { fontSize: 19, fontWeight: '700', color: T.text, letterSpacing: -0.5, marginBottom: 6, fontFamily: 'DMSans_700Bold' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  meta: { fontSize: 13, color: T.textMid, fontFamily: 'DMSans_400Regular' },

  mapPlaceholder: {
    height: 100, borderRadius: 16, borderWidth: 1.5, borderColor: T.border,
    backgroundColor: T.bg2, alignItems: 'center', justifyContent: 'center',
    marginTop: 12, marginBottom: 16,
  },
  mapLabel: { fontSize: 12, color: T.textMid, fontFamily: 'DMSans_400Regular' },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: T.text, marginBottom: 8, fontFamily: 'DMSans_600SemiBold' },
  avatarRow: { flexDirection: 'row', gap: 6, marginTop: 10, marginBottom: 16 },
  addSlot: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1.5,
    borderColor: T.border, borderStyle: 'dashed',
    backgroundColor: T.bg2, alignItems: 'center', justifyContent: 'center',
  },
  addSlotText: { fontSize: 16, color: T.textSub },

  hostCard: {
    backgroundColor: T.card, borderRadius: 16, padding: 12,
    paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  hostedBy: { fontSize: 11, color: T.textSub, fontFamily: 'DMSans_400Regular' },
  hostName: { fontSize: 14, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold' },
  messageBtn: { backgroundColor: T.coralL, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  messageBtnText: { fontSize: 12, fontWeight: '500', color: T.coralD, fontFamily: 'DMSans_500Medium' },

  ctaContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: 'transparent',
  },
});
