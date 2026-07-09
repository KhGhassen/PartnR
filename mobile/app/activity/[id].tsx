import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Share, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../constants/tokens';
import { getEvent, joinEvent, leaveEvent, type EventDetail } from '../../api/events';
import { addEventPhoto, deleteEventPhoto } from '../../api/eventPhotos';
import { listEventComments, addEventComment, deleteEventComment, type EventComment } from '../../api/eventComments';
import { pickAndUploadImage } from '../../api/uploads';
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
  const [photoLoading, setPhotoLoading] = useState(false);
  const [comments, setComments] = useState<EventComment[]>([]);
  const [question, setQuestion] = useState('');
  const [sendingQuestion, setSendingQuestion] = useState(false);

  const fetchEvent = async () => {
    try {
      setEvent(await getEvent(id!));
    } catch {
      setError('Événement introuvable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
    listEventComments(id!).then(setComments).catch(() => {});
  }, [id]);

  if (loading) {
    return <View style={[styles.screen, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={T.coral} /></View>;
  }
  if (!event) {
    return <View style={[styles.screen, { paddingTop: insets.top }]}><Text style={styles.notFound}>{error}</Text></View>;
  }

  const isCreator   = user?.id === event.creatorId;
  const isParticipant = event.participants.some((p) => p.userId === user?.id && p.status === 'Confirmed');
  const isWaitlisted = event.participants.some((p) => p.userId === user?.id && p.status === 'Waitlisted');
  const waitlistCount = event.participants.filter((p) => p.status === 'Waitlisted').length;
  const isFull = event.participantCount >= event.maxParticipants;
  const spotsLeft = event.maxParticipants - event.participantCount;

  const handleShare = () => {
    Share.share({
      message: `Rejoins-moi sur PartnR : ${event.title} 🎉`,
      title: event.title,
    }).catch(() => {});
  };

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
    : actionLoading
    ? 'En cours…'
    : isParticipant
    ? 'Quitter l\'activité'
    : isWaitlisted
    ? 'Quitter la liste d\'attente'
    : isFull
    ? 'Rejoindre la liste d\'attente ⏳'
    : `Rejoindre · ${spotsLeft} place${spotsLeft !== 1 ? 's' : ''}`;

  const ctaAction = isCreator ? undefined : isParticipant || isWaitlisted ? handleLeave : handleJoin;

  const handleAddPhoto = async () => {
    setPhotoLoading(true);
    try {
      const url = await pickAndUploadImage();
      if (url) {
        await addEventPhoto(event.id, { url });
        await fetchEvent();
      }
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    setSendingQuestion(true);
    try {
      const comment = await addEventComment(event.id, question.trim());
      setComments((cs) => [...cs, comment]);
      setQuestion('');
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSendingQuestion(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteEventComment(event.id, commentId);
      setComments((cs) => cs.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deleteEventPhoto(event.id, photoId);
      await fetchEvent();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: T.coralL, paddingTop: insets.top + 12 }]}>
        {event.photoUrl ? (
          <Image source={{ uri: event.photoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Text style={styles.heroEmoji}>{event.activityIcon}</Text>
        )}
        <View style={styles.heroTop}>
          <BackBtn onPress={() => router.back()} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
              <Text style={styles.shareBtnText}>↗ Partager</Text>
            </TouchableOpacity>
            <View style={[styles.statusBadge, { backgroundColor: event.status === 'Published' ? '#D1FAE5' : T.bg2 }]}>
              <Text style={[styles.statusText, { color: event.status === 'Published' ? '#065F46' : T.textMid }]}>
                {event.status === 'Published' ? 'Publié' : event.status === 'Completed' ? 'Terminé' : 'Annulé'}
              </Text>
            </View>
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
          <Text style={styles.sectionTitle}>Participants ({event.participantCount}/{event.maxParticipants}){waitlistCount > 0 ? ` · ${waitlistCount} en attente` : ''}</Text>
          <ProgressBar joined={event.participantCount} total={event.maxParticipants} />
          <View style={styles.avatarRow}>
            {event.participants
              .filter((p) => p.status === 'Confirmed')
              .map((p) => (
                <Avatar key={p.userId} initials={p.firstName[0]} size={32} />
              ))}
          </View>
        </View>

        {/* Public questions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions</Text>
          {comments.length === 0 ? (
            <Text style={styles.noPhotos}>Une question avant de rejoindre ? Posez-la ici.</Text>
          ) : (
            <View style={{ gap: 8, marginTop: 8 }}>
              {comments.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onLongPress={() => (c.userId === user?.id || isCreator) && handleDeleteComment(c.id)}
                  activeOpacity={0.9}
                  style={styles.commentCard}
                >
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{c.userName}</Text>
                    {c.isOrganizer && (
                      <View style={styles.organizerBadge}>
                        <Text style={styles.organizerBadgeText}>Organisateur</Text>
                      </View>
                    )}
                    <Text style={styles.commentDate}>
                      {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Text style={styles.commentContent}>{c.content}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {user && (
            <View style={styles.questionRow}>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Posez votre question…"
                placeholderTextColor={T.textSub}
                maxLength={500}
                style={styles.questionInput}
              />
              <TouchableOpacity
                onPress={handleAskQuestion}
                disabled={sendingQuestion || !question.trim()}
                style={[styles.questionSend, (!question.trim() || sendingQuestion) && { opacity: 0.5 }]}
              >
                <Text style={styles.questionSendText}>{sendingQuestion ? '…' : '➤'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Photo gallery */}
        <View style={styles.section}>
          <View style={styles.galleryHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            {isParticipant && (
              <TouchableOpacity onPress={handleAddPhoto} disabled={photoLoading}>
                <Text style={styles.addPhotoLink}>{photoLoading ? 'Envoi…' : '+ Ajouter'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {event.photos.length === 0 ? (
            <Text style={styles.noPhotos}>Aucune photo pour l'instant.</Text>
          ) : (
            <View style={styles.photoGrid}>
              {event.photos.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onLongPress={() => (p.uploaderId === user?.id || isCreator) && handleDeletePhoto(p.id)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: p.url }} style={styles.photoThumb} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          )}
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
          disabled={actionLoading || isCreator}
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
  commentCard: { backgroundColor: T.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: T.border },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold' },
  organizerBadge: { backgroundColor: T.violetL, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  organizerBadgeText: { fontSize: 9, fontWeight: '600', color: T.violet, fontFamily: 'DMSans_600SemiBold' },
  commentDate: { marginLeft: 'auto', fontSize: 11, color: T.textSub, fontFamily: 'DMSans_400Regular' },
  commentContent: { fontSize: 13, color: T.textMid, fontFamily: 'DMSans_400Regular' },
  questionRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  questionInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
    borderWidth: 1.5, borderColor: T.border, fontSize: 13,
    fontFamily: 'DMSans_400Regular', color: T.text, backgroundColor: '#fff',
  },
  questionSend: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.coral, alignItems: 'center', justifyContent: 'center' },
  questionSendText: { color: '#fff', fontSize: 15 },

  shareBtn: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  shareBtnText: { fontSize: 12, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold' },

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

  galleryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addPhotoLink:  { fontSize: 13, fontWeight: '600', color: T.coral, fontFamily: 'DMSans_600SemiBold' },
  noPhotos:  { fontSize: 13, color: T.textSub, fontFamily: 'DMSans_400Regular' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb: { width: 92, height: 92, borderRadius: 12, backgroundColor: T.bg2 },

  hostCard:  { backgroundColor: T.card, borderRadius: 16, padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, marginBottom: 12 },
  hostedBy:  { fontSize: 11, color: T.textSub, fontFamily: 'DMSans_400Regular' },
  hostName:  { fontSize: 14, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold' },
  errorText: { fontSize: 13, color: '#E53E3E', textAlign: 'center', fontFamily: 'DMSans_400Regular' },

  ctaContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: 'transparent' },
});
