import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../constants/tokens';
import { INTERESTS } from '../constants/data';
import { useApp } from '../context/AppContext';
import CTAButton from '../components/CTAButton';

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (item: string) =>
    setSelected((s) => (s.includes(item) ? s.filter((x) => x !== item) : [...s, item]));

  const finish = () => {
    completeOnboarding(name.trim() || 'Alex');
    router.replace('/(tabs)');
  };

  if (step === 0) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>🤝</Text>
          <Text style={styles.heroTitle}>
            Find your{'\n'}<Text style={{ color: T.coral }}>PartnR</Text>
          </Text>
          <Text style={styles.heroSub}>
            Connect with people who share your passions — in real life.
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity onPress={() => setStep(1)} style={styles.googleBtn} activeOpacity={0.8}>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep(1)} style={styles.fbBtn} activeOpacity={0.8}>
            <Text style={styles.fbF}>f</Text>
            <Text style={styles.fbText}>Continue with Facebook</Text>
          </TouchableOpacity>
          <Text style={styles.terms}>
            By joining you agree to our <Text style={{ color: T.coral }}>Terms</Text>
          </Text>
        </View>
      </View>
    );
  }

  if (step === 1) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
          <StepDots current={0} />
          <Text style={styles.stepTitle}>What's your name?</Text>
          <Text style={styles.stepSub}>This is how others will see you.</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your first name"
            placeholderTextColor={T.textSub}
            style={styles.input}
            autoFocus
          />

          <View style={{ marginTop: 'auto' }}>
            <CTAButton label="Continue" onPress={() => name.trim() && setStep(2)} />
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <StepDots current={1} />
      <Text style={styles.stepTitle}>Pick your interests</Text>
      <Text style={styles.stepSub}>Select at least 3 to get the best matches.</Text>

      <ScrollView
        contentContainerStyle={styles.interestsGrid}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {INTERESTS.map((item) => {
          const active = selected.includes(item);
          return (
            <TouchableOpacity
              key={item}
              onPress={() => toggle(item)}
              activeOpacity={0.75}
              style={[styles.interestChip, active ? styles.chipActive : styles.chipInactive]}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, paddingTop: 12 }}>
        <CTAButton
          label={`Continue${selected.length >= 3 ? ' ✓' : ''}`}
          onPress={() => selected.length >= 3 && finish()}
          disabled={selected.length < 3}
        />
      </View>
    </View>
  );
}

function StepDots({ current }: { current: number }) {
  return (
    <View style={dots.row}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[dots.dot, i <= current ? dots.active : dots.inactive]} />
      ))}
    </View>
  );
}

const dots = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, marginBottom: 24 },
  dot: { flex: 1, height: 3, borderRadius: 3 },
  active:   { backgroundColor: T.coral },
  inactive: { backgroundColor: T.border },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: T.bg,
    paddingHorizontal: 24,
  },
  heroSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 52, marginBottom: 16 },
  heroTitle: {
    fontSize: 28, fontWeight: '700', color: T.text,
    letterSpacing: -0.8, textAlign: 'center', marginBottom: 8,
    fontFamily: 'DMSans_700Bold',
  },
  heroSub: {
    fontSize: 14, color: T.textMid, lineHeight: 22, textAlign: 'center',
    maxWidth: 220, fontFamily: 'DMSans_400Regular',
  },

  buttons: { gap: 10 },
  googleBtn: {
    paddingVertical: 13, borderRadius: 999, borderWidth: 1.5, borderColor: T.border,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  googleG: { fontSize: 18, fontWeight: '600', color: T.text },
  googleText: { fontSize: 14, fontWeight: '500', color: T.text, fontFamily: 'DMSans_500Medium' },
  fbBtn: {
    paddingVertical: 13, borderRadius: 999, backgroundColor: '#1877F2',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  fbF: { fontSize: 16, fontWeight: '700', color: '#fff' },
  fbText: { fontSize: 14, fontWeight: '500', color: '#fff', fontFamily: 'DMSans_500Medium' },
  terms: { textAlign: 'center', fontSize: 12, color: T.textSub, fontFamily: 'DMSans_400Regular' },

  stepTitle: {
    fontSize: 22, fontWeight: '700', color: T.text, letterSpacing: -0.5,
    marginBottom: 4, fontFamily: 'DMSans_700Bold',
  },
  stepSub: { fontSize: 13, color: T.textMid, marginBottom: 20, fontFamily: 'DMSans_400Regular' },
  input: {
    paddingHorizontal: 16, paddingVertical: 13, borderRadius: 16,
    borderWidth: 1.5, borderColor: T.border, fontSize: 15,
    fontFamily: 'DMSans_400Regular', color: T.text, backgroundColor: '#fff',
  },

  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  interestChip: { borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 7 },
  chipActive:   { borderColor: T.coral, backgroundColor: T.coralL },
  chipInactive: { borderColor: T.border, backgroundColor: '#fff' },
  chipText:          { fontSize: 13, fontWeight: '500', fontFamily: 'DMSans_500Medium' },
  chipTextActive:    { color: T.coralD },
  chipTextInactive:  { color: T.textMid },
});
