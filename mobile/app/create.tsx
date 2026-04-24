import { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../constants/tokens';
import BackBtn from '../components/BackBtn';
import CTAButton from '../components/CTAButton';

const CATEGORIES = [
  { label: 'Running',  emoji: '🏃' },
  { label: 'Food',     emoji: '🍽️' },
  { label: 'Music',    emoji: '🎵' },
  { label: 'Sports',   emoji: '⚽' },
  { label: 'Art',      emoji: '🎨' },
  { label: 'Travel',   emoji: '✈️' },
  { label: 'Coffee',   emoji: '☕' },
  { label: 'Outdoors', emoji: '🌿' },
];

const STEP_TITLES = ['Pick a category', 'Activity details', 'Preferences'];
const STEPS = ['Category', 'Details', 'Settings'];

type FormState = {
  title: string;
  category: string;
  date: string;
  location: string;
  maxPeople: number;
};

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    title: '', category: '', date: '', location: '', maxPeople: 6,
  });

  const isValid = [
    form.category.length > 0,
    form.title.trim().length > 0 && form.location.trim().length > 0,
    true,
  ];

  const handleNext = () => {
    if (!isValid[step]) return;
    if (step < 2) {
      setStep((s) => s + 1);
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <BackBtn onPress={() => (step === 0 ? router.back() : setStep((s) => s - 1))} />
          <Text style={styles.headerTitle}>New Activity</Text>
          <View style={styles.stepDots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i <= step ? styles.dotActive : styles.dotInactive, i === step && styles.dotWide]}
              />
            ))}
          </View>
        </View>

        {/* Step label */}
        <View style={styles.stepLabel}>
          <Text style={styles.stepNum}>STEP {step + 1} OF {STEPS.length}</Text>
          <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>
        </View>

        {/* Step content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {step === 0 && (
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((c) => {
                const active = form.category === c.label;
                return (
                  <TouchableOpacity
                    key={c.label}
                    onPress={() => setForm((f) => ({ ...f, category: c.label }))}
                    activeOpacity={0.8}
                    style={[styles.categoryBtn, active ? styles.categoryActive : styles.categoryInactive]}
                  >
                    <Text style={styles.categoryEmoji}>{c.emoji}</Text>
                    <Text style={[styles.categoryLabel, active ? styles.categoryLabelActive : styles.categoryLabelInactive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {step === 1 && (
            <View style={styles.fields}>
              {[
                { label: 'Activity title', key: 'title' as const, placeholder: 'e.g. Morning Run — Central Park' },
                { label: 'Date & time',    key: 'date' as const,  placeholder: 'e.g. Sat, Apr 26 · 7:00 AM' },
                { label: 'Location',       key: 'location' as const, placeholder: 'Address or place name' },
              ].map((field) => (
                <View key={field.key}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    value={form[field.key]}
                    onChangeText={(v) => setForm((f) => ({ ...f, [field.key]: v }))}
                    placeholder={field.placeholder}
                    placeholderTextColor={T.textSub}
                    style={styles.fieldInput}
                  />
                </View>
              ))}
            </View>
          )}

          {step === 2 && (
            <View style={styles.prefs}>
              {/* Max participants stepper */}
              <View style={styles.prefCard}>
                <Text style={styles.prefTitle}>Max participants</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() => setForm((f) => ({ ...f, maxPeople: Math.max(2, f.maxPeople - 1) }))}
                    style={styles.stepperBtn}
                  >
                    <Text style={styles.stepperMinus}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{form.maxPeople}</Text>
                  <TouchableOpacity
                    onPress={() => setForm((f) => ({ ...f, maxPeople: Math.min(20, f.maxPeople + 1) }))}
                    style={[styles.stepperBtn, styles.stepperBtnPlus]}
                  >
                    <Text style={styles.stepperPlus}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Summary */}
              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <Text style={styles.summaryMain}>{form.category} · {form.title || '—'}</Text>
                <Text style={styles.summarySub}>{form.location || '—'} · up to {form.maxPeople} people</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <CTAButton
            label={step < 2 ? 'Continue' : 'Create Activity 🎉'}
            onPress={handleNext}
            disabled={!isValid[step]}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: T.bg },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 0 },
  headerTitle:{ flex: 1, fontSize: 16, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold' },
  stepDots:   { flexDirection: 'row', gap: 4 },
  dot:        { height: 6, borderRadius: 3 },
  dotInactive:{ width: 6, backgroundColor: T.border },
  dotActive:  { backgroundColor: T.coral },
  dotWide:    { width: 20 },

  stepLabel: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  stepNum:   { fontSize: 11, color: T.textSub, fontWeight: '500', marginBottom: 2, fontFamily: 'DMSans_500Medium' },
  stepTitle: { fontSize: 20, fontWeight: '700', color: T.text, letterSpacing: -0.5, fontFamily: 'DMSans_700Bold' },

  content: { paddingHorizontal: 20, paddingBottom: 16 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryBtn: {
    width: '47%', paddingVertical: 18, paddingHorizontal: 12,
    borderRadius: 16, borderWidth: 2,
    alignItems: 'center', gap: 6,
  },
  categoryActive:   { borderColor: T.coral, backgroundColor: T.coralL },
  categoryInactive: { borderColor: T.border, backgroundColor: T.card },
  categoryEmoji: { fontSize: 26 },
  categoryLabel: { fontSize: 13, fontWeight: '500', fontFamily: 'DMSans_500Medium' },
  categoryLabelActive:   { color: T.coralD },
  categoryLabelInactive: { color: T.textMid },

  fields: { gap: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: T.textMid, marginBottom: 5, fontFamily: 'DMSans_600SemiBold' },
  fieldInput: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16,
    borderWidth: 1.5, borderColor: T.border, fontSize: 14,
    fontFamily: 'DMSans_400Regular', color: T.text, backgroundColor: '#fff',
  },

  prefs:    { gap: 16 },
  prefCard: {
    backgroundColor: T.card, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  prefTitle:   { fontSize: 13, fontWeight: '600', color: T.text, marginBottom: 12, fontFamily: 'DMSans_600SemiBold' },
  stepper:     { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn:  {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1.5,
    borderColor: T.border, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  stepperBtnPlus: { backgroundColor: T.coral, borderColor: T.coral },
  stepperMinus:   { fontSize: 18, color: T.textMid },
  stepperPlus:    { fontSize: 18, color: '#fff' },
  stepperValue:   { fontSize: 24, fontWeight: '700', color: T.text, flex: 1, textAlign: 'center', fontFamily: 'DMSans_700Bold' },

  summary: { backgroundColor: T.coralL, borderRadius: 16, padding: 14, paddingHorizontal: 16 },
  summaryTitle: { fontSize: 12, fontWeight: '600', color: T.coralD, marginBottom: 8, fontFamily: 'DMSans_600SemiBold' },
  summaryMain:  { fontSize: 13, color: T.coralD, fontFamily: 'DMSans_400Regular' },
  summarySub:   { fontSize: 12, color: T.coralD, opacity: 0.8, marginTop: 2, fontFamily: 'DMSans_400Regular' },

  footer: { paddingHorizontal: 20, paddingTop: 0 },
});
