import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../constants/tokens';
import { register as apiRegister } from '../api/auth';
import { toApiError } from '../api/client';
import { useApp } from '../context/AppContext';
import CTAButton from '../components/CTAButton';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { login, pendingName } = useApp();

  const [firstName, setFirstName] = useState(pendingName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName.trim() || !email.trim() || !password || !city.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { token, user } = await apiRegister({
        firstName: firstName.trim(),
        email: email.trim(),
        password,
        city: city.trim(),
      });
      await login(token, user);
      router.replace('/(tabs)');
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'Prénom',         value: firstName, set: setFirstName, placeholder: 'Votre prénom',           secure: false, keyboard: 'default' as const },
    { label: 'Email',          value: email,     set: setEmail,     placeholder: 'votre@email.com',        secure: false, keyboard: 'email-address' as const },
    { label: 'Mot de passe',   value: password,  set: setPassword,  placeholder: '8 caractères minimum',  secure: true,  keyboard: 'default' as const },
    { label: 'Ville',          value: city,      set: setCity,      placeholder: 'Paris, Lyon…',           secure: false, keyboard: 'default' as const },
  ];

  const isValid = firstName.trim() && email.trim() && password.length >= 8 && city.trim();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.screen, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.sub}>Rejoignez la communauté PartnR</Text>

        <View style={styles.form}>
          {fields.map((f) => (
            <View key={f.label}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                value={f.value}
                onChangeText={f.set}
                placeholder={f.placeholder}
                placeholderTextColor={T.textSub}
                secureTextEntry={f.secure}
                keyboardType={f.keyboard}
                autoCapitalize={f.keyboard === 'email-address' ? 'none' : 'words'}
                autoCorrect={false}
                style={styles.input}
              />
            </View>
          ))}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <CTAButton
            label={loading ? 'Création…' : 'Créer mon compte'}
            onPress={handleRegister}
            disabled={loading || !isValid}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}>Se connecter</Text>
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
  },
  title: { fontSize: 26, fontWeight: '700', color: T.text, letterSpacing: -0.5, fontFamily: 'DMSans_700Bold', marginBottom: 6 },
  sub:   { fontSize: 14, color: T.textMid, fontFamily: 'DMSans_400Regular', marginBottom: 28 },

  form:  { gap: 14 },
  label: { fontSize: 13, fontWeight: '600', color: T.textMid, marginBottom: 5, fontFamily: 'DMSans_600SemiBold' },
  input: {
    paddingHorizontal: 16, paddingVertical: 13, borderRadius: 16,
    borderWidth: 1.5, borderColor: T.border, fontSize: 15,
    fontFamily: 'DMSans_400Regular', color: T.text, backgroundColor: '#fff',
  },
  error: { fontSize: 13, color: '#E53E3E', fontFamily: 'DMSans_400Regular', textAlign: 'center' },

  footer:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: T.textMid, fontFamily: 'DMSans_400Regular' },
  footerLink: { fontSize: 14, color: T.coral, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
});
