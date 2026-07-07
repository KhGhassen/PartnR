import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../constants/tokens';
import { resetPassword } from '../api/auth';
import { toApiError } from '../api/client';
import CTAButton from '../components/CTAButton';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { token, email } = useLocalSearchParams<{ token: string; email: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword({ email: email ?? '', token: token ?? '', newPassword });
      setDone(true);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.emoji}>✅</Text>
        <Text style={styles.title}>Mot de passe réinitialisé</Text>
        <Text style={styles.subtitle}>
          Votre mot de passe a bien été modifié. Vous pouvez maintenant vous connecter.
        </Text>
        <CTAButton label="Se connecter" onPress={() => router.replace('/login')} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: T.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Nouveau mot de passe</Text>
        <Text style={styles.subtitle}>
          Choisissez un nouveau mot de passe pour votre compte.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Nouveau mot de passe"
          placeholderTextColor={T.textSub}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          placeholderTextColor={T.textSub}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <CTAButton
          label={loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          onPress={handleSubmit}
          disabled={loading || !newPassword || !confirmPassword}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    backgroundColor: T.bg,
  },
  backBtn: { marginBottom: 32 },
  backText: { color: T.violet, fontSize: 15 },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  title: {
    fontSize: 26,
    fontFamily: 'DMSans_700Bold',
    color: T.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: T.textSub,
    marginBottom: 28,
    lineHeight: 22,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: T.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 12,
  },
});
