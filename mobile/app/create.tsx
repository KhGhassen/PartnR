import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../constants/tokens';
import { listActivities, type Activity } from '../api/activities';
import { listCities } from '../api/cities';
import { createEvent } from '../api/events';
import { toApiError } from '../api/client';
import BackBtn from '../components/BackBtn';
import CTAButton from '../components/CTAButton';

const STEP_TITLES = ['Choisir une activité', 'Détails', 'Paramètres'];

type FormState = {
  activityId: string;
  activityName: string;
  title: string;
  description: string;
  date: string;
  city: string;
  location: string;
  maxPeople: number;
};

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>({
    activityId: '', activityName: '', title: '', description: '',
    date: '', city: '', location: '', maxPeople: 6,
  });

  useEffect(() => {
    listActivities()
      .then(setActivities)
      .catch(() => {})
      .finally(() => setLoadingActivities(false));
    listCities().then(setCities).catch(() => {});
  }, []);

  const isValid = [
    form.activityId.length > 0,
    form.title.trim().length >= 3 && form.date.length > 0 && form.city.trim().length > 0,
    true,
  ];

  const handleNext = async () => {
    if (!isValid[step]) return;
    if (step < 2) { setStep((s) => s + 1); return; }

    setSubmitting(true);
    setError('');
    try {
      const ev = await createEvent({
        activityId: form.activityId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        city: form.city.trim(),
        location: form.location.trim() || undefined,
        date: new Date(form.date).toISOString(),
        maxParticipants: form.maxPeople,
      });
      router.replace(`/activity/${ev.id}`);
    } catch (err) {
      setError(toApiError(err).message);
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <BackBtn onPress={() => (step === 0 ? router.back() : setStep((s) => s - 1))} />
          <Text style={styles.headerTitle}>Nouvelle activité</Text>
          <View style={styles.stepDots}>
            {STEP_TITLES.map((_, i) => (
              <View key={i} style={[styles.dot, i <= step ? styles.dotActive : styles.dotInactive, i === step && styles.dotWide]} />
            ))}
          </View>
        </View>

        {/* Step label */}
        <View style={styles.stepLabel}>
          <Text style={styles.stepNum}>ÉTAPE {step + 1} / {STEP_TITLES.length}</Text>
          <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>
        </View>

        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Step 0 — Pick activity */}
          {step === 0 && (
            loadingActivities ? (
              <ActivityIndicator color={T.coral} style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.activityGrid}>
                {activities.map((a) => {
                  const active = form.activityId === a.id;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => setForm((f) => ({ ...f, activityId: a.id, activityName: a.name }))}
                      activeOpacity={0.8}
                      style={[styles.activityBtn, active ? styles.activityActive : styles.activityInactive]}
                    >
                      <Text style={styles.activityEmoji}>{a.icon}</Text>
                      <Text style={[styles.activityLabel, active ? styles.activityLabelActive : styles.activityLabelInactive]}>
                        {a.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          )}

          {/* Step 1 — Details */}
          {step === 1 && (
            <View style={styles.fields}>
              {[
                { label: 'Titre *',       key: 'title' as const,       placeholder: 'Ex: Footing matinal au parc' },
                { label: 'Lieu / RDV',    key: 'location' as const,    placeholder: 'Ex: Entrée du parc' },
                { label: 'Description',   key: 'description' as const, placeholder: 'Décrivez votre activité…' },
              ].map((field) => (
                <View key={field.key}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    value={form[field.key]}
                    onChangeText={(v) => setForm((f) => ({ ...f, [field.key]: v }))}
                    placeholder={field.placeholder}
                    placeholderTextColor={T.textSub}
                    multiline={field.key === 'description'}
                    numberOfLines={field.key === 'description' ? 3 : 1}
                    style={[styles.fieldInput, field.key === 'description' && styles.fieldInputMulti]}
                  />
                </View>
              ))}
              <View>
                <Text style={styles.fieldLabel}>Ville *</Text>
                <View style={styles.cityGrid}>
                  {cities.map((c) => {
                    const active = form.city === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setForm((f) => ({ ...f, city: c }))}
                        activeOpacity={0.75}
                        style={[styles.cityChip, active ? styles.chipActive : styles.chipInactive]}
                      >
                        <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                          {c}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View>
                <Text style={styles.fieldLabel}>Date et heure *</Text>
                <TextInput
                  value={form.date}
                  onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
                  placeholder="YYYY-MM-DDTHH:MM  ex: 2025-05-10T09:00"
                  placeholderTextColor={T.textSub}
                  style={styles.fieldInput}
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          {/* Step 2 — Settings */}
          {step === 2 && (
            <View style={styles.prefs}>
              <View style={styles.prefCard}>
                <Text style={styles.prefTitle}>Nombre max de participants</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() => setForm((f) => ({ ...f, maxPeople: Math.max(2, f.maxPeople - 1) }))}
                    style={styles.stepperBtn}
                  >
                    <Text style={styles.stepperMinus}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{form.maxPeople}</Text>
                  <TouchableOpacity
                    onPress={() => setForm((f) => ({ ...f, maxPeople: Math.min(50, f.maxPeople + 1) }))}
                    style={[styles.stepperBtn, styles.stepperBtnPlus]}
                  >
                    <Text style={styles.stepperPlus}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Récapitulatif</Text>
                <Text style={styles.summaryMain}>{form.activityName} · {form.title || '—'}</Text>
                <Text style={styles.summarySub}>{form.city || '—'}{form.location ? ` — ${form.location}` : ''}</Text>
                <Text style={styles.summarySub}>Jusqu'à {form.maxPeople} participants</Text>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          )}
        </ScrollView>

        {/* CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <CTAButton
            label={step < 2 ? 'Continuer' : submitting ? 'Création…' : 'Créer l\'activité 🎉'}
            onPress={handleNext}
            disabled={!isValid[step] || submitting}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: T.text, fontFamily: 'DMSans_600SemiBold' },
  stepDots: { flexDirection: 'row', gap: 4 },
  dot: { height: 6, borderRadius: 3 },
  dotInactive: { width: 6, backgroundColor: T.border },
  dotActive:   { backgroundColor: T.coral },
  dotWide:     { width: 20 },

  stepLabel: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  stepNum:   { fontSize: 11, color: T.textSub, fontWeight: '500', marginBottom: 2, fontFamily: 'DMSans_500Medium' },
  stepTitle: { fontSize: 20, fontWeight: '700', color: T.text, letterSpacing: -0.5, fontFamily: 'DMSans_700Bold' },

  content: { paddingHorizontal: 20, paddingBottom: 16 },

  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  activityBtn: { width: '47%', paddingVertical: 18, paddingHorizontal: 12, borderRadius: 16, borderWidth: 2, alignItems: 'center', gap: 6 },
  activityActive:   { borderColor: T.coral, backgroundColor: T.coralL },
  activityInactive: { borderColor: T.border, backgroundColor: T.card },
  activityEmoji: { fontSize: 26 },
  activityLabel: { fontSize: 13, fontWeight: '500', fontFamily: 'DMSans_500Medium' },
  activityLabelActive:   { color: T.coralD },
  activityLabelInactive: { color: T.textMid },

  fields: { gap: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: T.textMid, marginBottom: 5, fontFamily: 'DMSans_600SemiBold' },
  fieldInput: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16,
    borderWidth: 1.5, borderColor: T.border, fontSize: 14,
    fontFamily: 'DMSans_400Regular', color: T.text, backgroundColor: '#fff',
  },
  fieldInputMulti: { minHeight: 80, textAlignVertical: 'top' },

  cityGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip:  { borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 7 },
  chipActive:    { borderColor: T.coral, backgroundColor: T.coralL },
  chipInactive:  { borderColor: T.border, backgroundColor: '#fff' },
  chipText:         { fontSize: 13, fontWeight: '500', fontFamily: 'DMSans_500Medium' },
  chipTextActive:   { color: T.coralD },
  chipTextInactive: { color: T.textMid },

  prefs: { gap: 16 },
  prefCard: { backgroundColor: T.card, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  prefTitle: { fontSize: 13, fontWeight: '600', color: T.text, marginBottom: 12, fontFamily: 'DMSans_600SemiBold' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: T.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  stepperBtnPlus: { backgroundColor: T.coral, borderColor: T.coral },
  stepperMinus: { fontSize: 18, color: T.textMid },
  stepperPlus:  { fontSize: 18, color: '#fff' },
  stepperValue: { fontSize: 24, fontWeight: '700', color: T.text, flex: 1, textAlign: 'center', fontFamily: 'DMSans_700Bold' },

  summary: { backgroundColor: T.coralL, borderRadius: 16, padding: 14, paddingHorizontal: 16 },
  summaryTitle: { fontSize: 12, fontWeight: '600', color: T.coralD, marginBottom: 8, fontFamily: 'DMSans_600SemiBold' },
  summaryMain:  { fontSize: 13, color: T.coralD, fontFamily: 'DMSans_400Regular' },
  summarySub:   { fontSize: 12, color: T.coralD, opacity: 0.8, marginTop: 2, fontFamily: 'DMSans_400Regular' },

  errorText: { fontSize: 13, color: '#E53E3E', textAlign: 'center', fontFamily: 'DMSans_400Regular' },
  footer: { paddingHorizontal: 20, paddingTop: 4 },
});
