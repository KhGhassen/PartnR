import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../constants/tokens';
import { getEvent, joinEvent, leaveEvent, type EventDetail } from '../../api/events';
import { toApiError } from '../../api/client';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/Avatar';
import BackBtn from '../../components/BackBtn';
import ProgressBar from '../../components/ProgressBar';
import CTAButton from '../../components/CTAButton';

export default function ActivityDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useApp();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEvent = async () => {
    try {
      setEvent(await getEvent(id!));
    } catch {
      setError('Événement introuvable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvent(); }, [id]);

  if (loading) {
    return <View style={[styles.screen, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={T.coral} /></View>;
  }
  if (!event) {
    return <View style={[styles.screen, { paddingTop: insets.top }]}><Text style={styles.notFound}>{error}</Text></View>;
  }

  const isCreator   = user?.id === event.creatorId;
  const isParticipant = event.participants.some((p) => p.userId === user?.id && p.status === 'Confirmed');
  const isFull = event.participantCount >= event.maxParticipants;
  const spotsLeft = event.maxParticipants - event.participantCount;

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await joinEvent(event.id);
      await fetchEvent();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await leaveEvent(event.id);
      await fetchEvent();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setActionLoading(false);
    }
  };

  const ctaLabel = isCreator
    ? 'Vous êtes organisateur'
    : isParticipant
    ? 'Quitter l\'activité'
    : isFull
    ? 'Complet'
    : actionLoading
    ? 'En cours…'
    : `Rejoindre · ${spotsLeft} place${spotsLeft !== 1 ? 's' : ''}`;

  const ctaAction = isCreator || isFull ? undefined : isParticipant ? handleLeave : handleJoin;

  return (
    <View style={styles.screen}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: T.coralL, paddingTop: insets.top + 12 }]}>
        <Text style={styles.heroEmoji}>{event.activityIcon}</Text>
        <View style={styles.heroTop}>
          <BackBtn onPress={() => router.back()} />
          <View style={[styles.statusBadge, { backgroundColor: event.status === 'Published' ? '#D1FAE5' : T.bg2 }]}>
            <Text style={[styles.statusText, { color: event.status === 'Published' ? '#065F46' : T.textMid }]}>
              {event.status}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.activity}>{event.activityName}</Text>

        {event.description ? <Text style={styles.desc}>{event.description}</Text> : null}

        <View style={styles.metaRow}><Text style={styles.meta}>📅 {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text></View>
        <View style={styles.metaRow}><Text style={styles.meta}>📍 {event.city}{event.location ? ` — ${event.location}` : ''}</Text></View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants ({event.participantCount}/{event.maxParticipants})</Text>
          <ProgressBar joined={event.participantCount} total={event.maxParticipants} />
          <View style={styles.avatarRow}>
            {event.participants
              .filter((p) => p.status === 'Confirmed')
              .map((p) => (
                <Avatar key={p.userId} initials={p.firstName[0]} size={32} />
              ))}
          </View>
        </View>

        {/* Organizer */}
        <View style={styles.hostCard}>
          <Avatar initials={event.creatorName[0]} color={T.coralL} size={38} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hostedBy}>Organisé par</Text>
            <Text style={styles.hostName}>{event.creatorName}</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 12 }]}>
        <CTAButton
          label={ctaLabel}
          onPress={ctaAction}
          disabled={actionLoading || isCreator || isFull}
          style={isParticipant ? { backgroundColor: T.bg2 } : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  notFound: { padding: 20, color: T.textMid, textAlign: 'center', fontFamily: 'DMSans_400Regular' },

  hero: { height: 160, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  heroEmoji: { fontSize: 64 },
  heroTop: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:  { fontSize: 11, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },

  content: { paddingHorizontal: 20, paddingTop: 20 },
  title:    { fontSize: 19, fontWeight: '700', color: T.text, letterSpacing: -0.5, marginBottom: 2, fontFamily: 'DMSans_700Bold' },
  activity: { fontSize: 13, color: T.textSub, marginBottom: 10, fontFamily: 'DMSans_400Regular' },
  desc:     { fontSize: 14, color: T.textMid, lineHeight: 21, marginBottom: 12, fontFamily: 'DMSans_400Regular' },
  metaRow:  { flexDirection: 'row', marginBottom: 6 },
  meta:     { fontSize: 13, color: T.textMid, fontFamily: 'DMSans_400Regular' },

  section:      { marginTop: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: T.text, marginBottom: 8, fontFamily: 'DMSans_600SemiBold' },
  avatarRow:    { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },

  hostCard:  { backgroundColor: T.card, borderRadius: 16, padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, marginBottom: 12 },
  hostedBy:  { fontSize: 11, color: T.textSub, fontFamily: 'DMSans_400Regular' },
  hostName:  { fontSize: 14, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold' },
  errorText: { fontSize: 13, color: '#E53E3E', textAlign: 'center', fontFamily: 'DMSans_400Regular' },

  ctaContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: 'transparent' },
});
