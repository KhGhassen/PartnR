import { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../constants/tokens';
import { getEvent, type EventDetail } from '../../api/events';
import { useApp } from '../../context/AppContext';
import { useEventChat } from '../../hooks/useEventChat';
import BackBtn from '../../components/BackBtn';
import Avatar from '../../components/Avatar';

export default function ChatDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [text, setText] = useState('');

  const { messages, connected, error, sendMessage } = useEventChat(id!);

  useEffect(() => {
    getEvent(id!).then(setEvent).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages]);

  const send = async () => {
    const content = text.trim();
    if (!content || !connected) return;
    setText('');
    await sendMessage(content);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <BackBtn onPress={() => router.back()} />
        <View style={[styles.eventIcon, { backgroundColor: T.coralL }]}>
          <Text style={{ fontSize: 18 }}>{event?.activityIcon ?? '💬'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName} numberOfLines={1}>
            {event?.title ?? '…'}
          </Text>
          <Text style={styles.headerSub}>
            {connected ? `${event?.participantCount ?? '…'} participants` : 'Connexion…'}
          </Text>
        </View>
        {!connected && !error && <ActivityIndicator size="small" color={T.coral} />}
      </View>

      {/* Error state */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.messageList, { paddingBottom: 16 }]}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.length === 0 && connected && (
              <Text style={styles.empty}>Aucun message. Lancez la conversation !</Text>
            )}
            {messages.map((m) => {
              if (m.userId === 'system') {
                return (
                  <View key={m.id} style={styles.systemRow}>
                    <Text style={styles.systemText}>{m.content}</Text>
                  </View>
                );
              }
              const isMe = m.userId === user?.id;
              return (
                <View key={m.id} style={[styles.bubbleRow, isMe ? styles.rowMe : styles.rowThem]}>
                  {!isMe && (
                    <Avatar initials={m.userName[0]} color={T.coralL} size={28} />
                  )}
                  <View style={styles.bubbleWrap}>
                    {!isMe && (
                      <Text style={styles.senderName}>{m.userName}</Text>
                    )}
                    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                      <Text style={[styles.bubbleText, isMe ? styles.textMe : styles.textThem]}>
                        {m.content}
                      </Text>
                    </View>
                    <Text style={[styles.timestamp, isMe ? styles.tsMe : styles.tsThem]}>
                      {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Input bar */}
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              onSubmitEditing={send}
              placeholder={connected ? 'Message…' : 'Connexion en cours…'}
              placeholderTextColor={T.textSub}
              returnKeyType="send"
              editable={connected}
              style={[styles.input, !connected && styles.inputDisabled]}
            />
            <TouchableOpacity
              onPress={send}
              activeOpacity={0.8}
              disabled={!connected || !text.trim()}
              style={[styles.sendBtn, (!connected || !text.trim()) && styles.sendBtnDisabled]}
            >
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: T.card, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  eventIcon:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 14, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold' },
  headerSub:  { fontSize: 11, color: T.textSub, fontFamily: 'DMSans_400Regular' },

  errorBox:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 14, color: T.textMid, textAlign: 'center', fontFamily: 'DMSans_400Regular' },

  messageList: { paddingHorizontal: 14, paddingTop: 16 },
  empty: { textAlign: 'center', color: T.textSub, marginTop: 40, fontFamily: 'DMSans_400Regular', fontSize: 13 },

  bubbleRow: { flexDirection: 'row', marginBottom: 10, gap: 8 },
  rowMe:    { justifyContent: 'flex-end' },
  rowThem:  { justifyContent: 'flex-start', alignItems: 'flex-end' },
  bubbleWrap: { maxWidth: '72%' },
  senderName: { fontSize: 11, color: T.coral, fontWeight: '600', marginBottom: 2, fontFamily: 'DMSans_600SemiBold' },
  bubble:     { paddingHorizontal: 13, paddingVertical: 9 },
  bubbleMe:   { backgroundColor: T.coral,  borderRadius: 16, borderBottomRightRadius: 4 },
  bubbleThem: {
    backgroundColor: T.card, borderRadius: 16, borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  bubbleText: { fontSize: 13, lineHeight: 19, fontFamily: 'DMSans_400Regular' },
  textMe:     { color: '#fff' },
  textThem:   { color: T.text },
  timestamp:  { fontSize: 10, color: T.textSub, marginTop: 2, fontFamily: 'DMSans_400Regular' },
  tsMe:       { textAlign: 'right' },
  tsThem:     { textAlign: 'left' },

  inputBar: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingTop: 8,
    backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.border,
  },
  input: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
    borderWidth: 1.5, borderColor: T.border, fontSize: 13,
    fontFamily: 'DMSans_400Regular', color: T.text,
  },
  inputDisabled: { opacity: 0.5 },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: T.coral,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },

  systemRow: { alignItems: 'center', marginVertical: 4 },
  systemText: { fontSize: 11, color: T.textSub, backgroundColor: T.border, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, fontFamily: 'DMSans_400Regular' },
});
