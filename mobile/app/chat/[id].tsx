import { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../constants/tokens';
import { MESSAGES } from '../../constants/data';
import Avatar from '../../components/Avatar';
import BackBtn from '../../components/BackBtn';

type ChatMessage = { id: number; me: boolean; text: string; time: string };

const INITIAL_MESSAGES: Record<number, ChatMessage[]> = {
  1: [
    { id: 1, me: false, text: 'Hey! Looking forward to it 🎉', time: '9:30 AM' },
    { id: 2, me: false, text: 'Meet at the south entrance?',   time: '9:34 AM' },
    { id: 3, me: true,  text: "Sounds perfect! I'll be there at 7.", time: '9:40 AM' },
    { id: 4, me: false, text: 'See you at the park entrance!', time: '9:42 AM' },
  ],
  2: [
    { id: 1, me: false, text: 'Who else is coming tonight?',        time: 'Yesterday' },
    { id: 2, me: true,  text: "I'll be there around 8!",            time: 'Yesterday' },
    { id: 3, me: false, text: 'I got us a table near the stage 🎷', time: 'Yesterday' },
  ],
  3: [
    { id: 1, me: false, text: 'Are you joining the brunch on Sunday?', time: 'Tue' },
    { id: 2, me: true,  text: 'Definitely! What time?',               time: 'Tue' },
  ],
};

export default function ChatDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const numId = Number(id);
  const chat = MESSAGES.find((m) => m.id === numId);
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(
    INITIAL_MESSAGES[numId] ?? []
  );
  const [text, setText] = useState('');

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: Date.now(), me: true, text: trimmed, time: 'now' }]);
    setText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  if (!chat) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Text style={styles.notFound}>Chat not found.</Text>
      </View>
    );
  }

  const isEmoji = chat.avatar.length <= 2 && /\p{Emoji}/u.test(chat.avatar);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <BackBtn onPress={() => router.back()} />
        <Avatar
          initials={isEmoji ? undefined : chat.avatar}
          emoji={isEmoji ? chat.avatar : undefined}
          color={chat.color}
          size={32}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{chat.sender}</Text>
          <Text style={styles.headerSub}>#{chat.activity}</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.messageList, { paddingBottom: 16 }]}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((m) => (
          <View key={m.id} style={[styles.bubbleRow, m.me ? styles.bubbleRowMe : styles.bubbleRowThem]}>
            <View style={[styles.bubble, m.me ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, m.me ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                {m.text}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          placeholder="Message…"
          placeholderTextColor={T.textSub}
          returnKeyType="send"
          style={styles.input}
        />
        <TouchableOpacity onPress={send} activeOpacity={0.8} style={styles.sendBtn}>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  notFound: { padding: 20, color: T.textMid, textAlign: 'center', fontFamily: 'DMSans_400Regular' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: T.card,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  headerName: { fontSize: 14, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold' },
  headerSub:  { fontSize: 11, color: T.textSub, fontFamily: 'DMSans_400Regular' },

  messageList: { paddingHorizontal: 16, paddingTop: 16 },
  bubbleRow:   { marginBottom: 8 },
  bubbleRowMe:   { alignItems: 'flex-end' },
  bubbleRowThem: { alignItems: 'flex-start' },
  bubble: { maxWidth: '72%', paddingHorizontal: 13, paddingVertical: 9 },
  bubbleMe:   { backgroundColor: T.coral, borderRadius: 16, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: T.card,  borderRadius: 16, borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  bubbleText:     { fontSize: 13, lineHeight: 19, fontFamily: 'DMSans_400Regular' },
  bubbleTextMe:   { color: '#fff' },
  bubbleTextThem: { color: T.text },

  inputBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 8,
    backgroundColor: T.card,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  input: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
    borderWidth: 1.5, borderColor: T.border, fontSize: 13,
    fontFamily: 'DMSans_400Regular', color: T.text,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: T.coral,
    alignItems: 'center', justifyContent: 'center',
  },
});
