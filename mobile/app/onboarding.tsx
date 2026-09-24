import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../constants/tokens';
import { listActivities, groupByCategory, type Activity } from '../api/activities';
import { useApp } from '../context/AppContext';
import CTAButton from '../components/CTAButton';

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { setPendingName, setPendingInterests } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // The picks used to be a hard-coded English list ("Running", "Coffee",
  // "Jazz") that matched nothing in the French catalogue — and were then
  // thrown away anyway. This is the real catalogue, and it is saved.
  useEffect(() => {
    listActivities().then(setActivities).catch(() => {});
  }, []);

  const toggle = (item: string) =>
    setSelected((s) => (s.includes(item) ? s.filter((x) => x !== item) : [...s, item]));

  // Takes the picks explicitly: "Passer" calls setSelected([]) then finish() in
  // the same tick, and a closure over `selected` would still see the old list.
  const finish = (interests: string[] = selected) => {
    setPendingName(name.trim());
    setPendingInterests(interests);
    router.push('/register');
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
          <CTAButton label="Créer un compte" onPress={() => setStep(1)} />
          <CTAButton label="J'ai déjà un compte" secondary onPress={() => router.push('/login')} />
        </View>
      </View>
    );
  }

  if (step === 1) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
          <StepDots current={0} />
          <Text style={styles.stepTitle}>Comment vous appelez-vous ?</Text>
          <Text style={styles.stepSub}>C'est ainsi que les autres vous verront.</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Votre prénom"
            placeholderTextColor={T.textSub}
            style={styles.input}
            autoFocus
          />

          <View style={{ marginTop: 'auto' }}>
            <CTAButton label="Continuer" onPress={() => name.trim() && setStep(2)} disabled={!name.trim()} />
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <StepDots current={1} />
      <Text style={styles.stepTitle}>Vos centres d'intérêt</Text>
      <Text style={styles.stepSub}>Choisissez ce qui vous fait envie — modifiable à tout moment.</Text>

      <ScrollView
        contentContainerStyle={styles.interestsGrid}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {activities.length === 0 ? (
          <Text style={[styles.chipText, styles.chipTextInactive]}>Chargement du catalogue…</Text>
        ) : (
          groupByCategory(activities).map((g) => (
            <View key={g.category} style={{ width: '100%', marginBottom: 6 }}>
              <Text style={styles.categoryLabel}>{g.icon}  {g.category}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {g.activities.map((a) => {
                  const active = selected.includes(a.name);
                  return (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => toggle(a.name)}
                      activeOpacity={0.75}
                      style={[styles.interestChip, active ? styles.chipActive : styles.chipInactive]}
                    >
                      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                        {a.icon} {a.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Never gate sign-up on this step: with the API cold-starting for 30 s,
          a catalogue that has not loaded yet would otherwise be a dead end. */}
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, paddingTop: 12, gap: 10 }}>
        <CTAButton
          label={selected.length > 0 ? `Créer mon compte (${selected.length}) →` : 'Créer mon compte →'}
          onPress={() => finish()}
        />
        <TouchableOpacity onPress={() => finish([])} style={{ alignSelf: 'center', paddingVertical: 6 }}>
          <Text style={[styles.chipText, styles.chipTextInactive]}>Passer cette étape</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StepDots({ current }: { current: number }) {
  return (
    <View style={dots.row}>
      {[0, 1].map((i) => (
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
  screen: { flex: 1, backgroundColor: T.bg, paddingHorizontal: 24 },

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

  stepTitle: { fontSize: 22, fontWeight: '700', color: T.text, letterSpacing: -0.5, marginBottom: 4, fontFamily: 'DMSans_700Bold' },
  stepSub:   { fontSize: 13, color: T.textMid, marginBottom: 20, fontFamily: 'DMSans_400Regular' },
  input: {
    paddingHorizontal: 16, paddingVertical: 13, borderRadius: 16,
    borderWidth: 1.5, borderColor: T.border, fontSize: 15,
    fontFamily: 'DMSans_400Regular', color: T.text, backgroundColor: '#fff',
  },

  categoryLabel: { fontSize: 11, fontWeight: '600', color: T.textSub, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8, marginTop: 6, fontFamily: 'DMSans_600SemiBold' },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  interestChip:  { borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 7 },
  chipActive:    { borderColor: T.coral, backgroundColor: T.coralL },
  chipInactive:  { borderColor: T.border, backgroundColor: '#fff' },
  chipText:         { fontSize: 13, fontWeight: '500', fontFamily: 'DMSans_500Medium' },
  chipTextActive:   { color: T.coralD },
  chipTextInactive: { color: T.textMid },
});
