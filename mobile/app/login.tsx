import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../constants/tokens';
import { login as apiLogin } from '../api/auth';
import { toApiError } from '../api/client';
import { useApp } from '../context/AppContext';
import CTAButton from '../components/CTAButton';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      const { token, user } = await apiLogin({ email: email.trim(), password });
      await login(token, user);
      router.replace('/(tabs)');
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.screen, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>🤝</Text>
        <Text style={styles.title}>Bon retour !</Text>
        <Text style={styles.sub}>Connectez-vous à votre compte PartnR</Text>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              placeholderTextColor={T.textSub}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={T.textSub}
              secureTextEntry
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <CTAButton
            label={loading ? 'Connexion…' : 'Se connecter'}
            onPress={handleLogin}
            disabled={loading || !email.trim() || !password}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.footerLink}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: T.bg,
    paddingHorizontal: 24,
    alignItems: 'stretch',
  },
  logo:  { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: T.text, textAlign: 'center', letterSpacing: -0.5, fontFamily: 'DMSans_700Bold', marginBottom: 6 },
  sub:   { fontSize: 14, color: T.textMid, textAlign: 'center', fontFamily: 'DMSans_400Regular', marginBottom: 32 },

  form:  { gap: 16 },
  label: { fontSize: 13, fontWeight: '600', color: T.textMid, marginBottom: 6, fontFamily: 'DMSans_600SemiBold' },
  input: {
    paddingHorizontal: 16, paddingVertical: 13, borderRadius: 16,
    borderWidth: 1.5, borderColor: T.border, fontSize: 15,
    fontFamily: 'DMSans_400Regular', color: T.text, backgroundColor: '#fff',
  },
  error: { fontSize: 13, color: '#E53E3E', fontFamily: 'DMSans_400Regular', textAlign: 'center' },

  footer:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 },
  footerText: { fontSize: 14, color: T.textMid, fontFamily: 'DMSans_400Regular' },
  footerLink: { fontSize: 14, color: T.coral, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
});
