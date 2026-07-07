import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../constants/tokens';
import { forgotPassword } from '../api/auth';
import { toApiError } from '../api/client';
import CTAButton from '../components/CTAButton';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.emoji}>📧</Text>
        <Text style={styles.title}>Email envoyé</Text>
        <Text style={styles.subtitle}>
          Si un compte existe pour {email}, vous recevrez un lien de réinitialisation sous peu. Vérifiez aussi vos spams.
        </Text>
        <CTAButton label="Retour à la connexion" onPress={() => router.replace('/login')} />
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

        <Text style={styles.title}>Mot de passe oublié ?</Text>
        <Text style={styles.subtitle}>
          Entrez votre email pour recevoir un lien de réinitialisation.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={T.textSub}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <CTAButton
          label={loading ? 'Envoi...' : 'Envoyer le lien'}
          onPress={handleSubmit}
          disabled={loading || !email.trim()}
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
