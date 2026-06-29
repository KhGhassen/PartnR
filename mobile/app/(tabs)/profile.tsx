import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { T } from '../../constants/tokens';
import { getProfile, updateMyProfile, type Profile } from '../../api/profiles';
import { useApp } from '../../context/AppContext';
import Pill from '../../components/Pill';
import CTAButton from '../../components/CTAButton';

const PROFILE_TYPES = [
  { value: 'Aventurier', label: 'Aventurier' },
  { value: 'Social', label: 'Social' },
  { value: 'Detente', label: 'Détente' },
  { value: 'Sportif', label: 'Sportif' },
  { value: 'Creatif', label: 'Créatif' },
  { value: 'Calme', label: 'Calme' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useApp();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [savingType, setSavingType] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id)
      .then((p) => {
        setProfile(p);
        setSelectedType(p.profileType);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSaveType = async () => {
    setSavingType(true);
    try {
      const updated = await updateMyProfile({ profileType: selectedType });
      setProfile(updated);
      setEditingType(false);
    } catch {
      // keep edit mode open so the user can retry
    } finally {
      setSavingType(false);
    }
  };

  const handleCancelType = () => {
    setSelectedType(profile?.profileType ?? null);
    setEditingType(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const displayName = user?.firstName ?? 'Alex';
  const city = profile?.city ?? user?.city ?? '';
  const ratingAvg = profile?.ratingAvg ?? 0;
  const ratingCount = profile?.ratingCount ?? 0;
  const interests = profile?.favoriteActivities ?? [];

  const joinedYear = profile?.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : new Date().getFullYear();

  const STATS: [string, string][] = [
    [ratingCount > 0 ? ratingAvg.toFixed(1) : '—', 'Note'],
    [String(ratingCount), 'Avis'],
  ];

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      {/* Gradient header */}
      <LinearGradient
        colors={[T.coral, T.violet]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + 24 }]}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{displayName[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        {city ? <Text style={styles.profileMeta}>📍 {city} · Depuis {joinedYear}</Text> : null}
      </LinearGradient>

      <View style={[styles.content, { paddingBottom: insets.bottom + 80 }]}>
        {loading ? (
          <ActivityIndicator color={T.coral} style={{ marginTop: 24 }} />
        ) : (
          <>
            {/* Stats */}
            {ratingCount > 0 && (
              <View style={styles.statsCard}>
                {STATS.map(([num, label]) => (
                  <View key={label} style={styles.statItem}>
                    <Text style={styles.statNum}>{num}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Bio */}
            {profile?.bio ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>À propos</Text>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            ) : null}

            {/* Interests */}
            {interests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Centres d'intérêt</Text>
                <View style={styles.interestRow}>
                  {interests.map((i) => (
                    <Pill key={i} label={i} active small />
                  ))}
                </View>
              </View>
            )}

            {/* Profile category */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Catégorie de profil</Text>
                {!editingType && (
                  <TouchableOpacity onPress={() => setEditingType(true)}>
                    <Text style={styles.editLink}>Modifier</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.interestRow}>
                {PROFILE_TYPES.map((pt) => (
                  <Pill
                    key={pt.value}
                    label={pt.label}
                    active={selectedType === pt.value}
                    small
                    onPress={editingType ? () => setSelectedType(selectedType === pt.value ? null : pt.value) : undefined}
                  />
                ))}
              </View>
              {editingType && (
                <View style={styles.editActionsRow}>
                  <TouchableOpacity onPress={handleSaveType} disabled={savingType}>
                    <Text style={styles.saveLink}>{savingType ? 'Sauvegarde...' : 'Enregistrer'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCancelType}>
                    <Text style={styles.cancelLink}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        <CTAButton label="Se déconnecter" secondary onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },

  gradientHeader: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInitial: { fontSize: 28, fontWeight: '700', color: '#fff', fontFamily: 'DMSans_700Bold' },
  profileName:   { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4, fontFamily: 'DMSans_700Bold' },
  profileMeta:   { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: 'DMSans_400Regular' },

  content: { paddingHorizontal: 20, marginTop: -16 },

  statsCard: {
    backgroundColor: T.card, borderRadius: 24, padding: 16,
    flexDirection: 'row', marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  statItem:  { flex: 1, alignItems: 'center' },
  statNum:   { fontSize: 20, fontWeight: '700', color: T.coral, fontFamily: 'DMSans_700Bold' },
  statLabel: { fontSize: 11, color: T.textSub, fontFamily: 'DMSans_400Regular' },

  section: {
    backgroundColor: T.card, borderRadius: 16, padding: 14,
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: T.text, marginBottom: 10, fontFamily: 'DMSans_600SemiBold' },
  bioText:      { fontSize: 13, color: T.textMid, lineHeight: 20, fontFamily: 'DMSans_400Regular' },
  interestRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  editLink:     { fontSize: 12, color: T.coral, fontFamily: 'DMSans_600SemiBold' },
  editActionsRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  saveLink:     { fontSize: 12, color: T.coral, fontFamily: 'DMSans_600SemiBold' },
  cancelLink:   { fontSize: 12, color: T.textSub, fontFamily: 'DMSans_500Medium' },
});
