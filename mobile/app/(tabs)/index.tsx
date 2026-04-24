import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../constants/tokens';
import { ACTIVITIES } from '../../constants/data';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/Avatar';
import Pill from '../../components/Pill';
import ActivityCard from '../../components/ActivityCard';

const FILTERS = ['All', 'Running', 'Food', 'Music', 'Sports', 'Art'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userName } = useApp();
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered =
    activeFilter === 'All'
      ? ACTIVITIES
      : ACTIVITIES.filter((a) => a.category === activeFilter || a.tags.includes(activeFilter));

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning 👋</Text>
          <Text style={styles.name}>{userName || 'Alex'}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.searchBtn}>
            <Ionicons name="search" size={16} color={T.textMid} />
          </TouchableOpacity>
          <Avatar initials={(userName || 'Alex')[0] + 'J'} color={T.coralL} size={36} />
        </View>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filtersScroll}
      >
        {FILTERS.map((f) => (
          <Pill key={f} label={f} active={activeFilter === f} onPress={() => setActiveFilter(f)} />
        ))}
      </ScrollView>

      {/* Feed */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feed}
      >
        {/* Near you banner */}
        <LinearGradient
          colors={[T.coral, T.violet]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <Text style={styles.bannerSub}>📍 Near you · New York</Text>
          <Text style={styles.bannerMain}>{ACTIVITIES.length} activities happening this week</Text>
        </LinearGradient>

        {filtered.map((act) => (
          <ActivityCard
            key={act.id}
            act={act}
            onPress={() => router.push(`/activity/${act.id}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
  },
  greeting: { fontSize: 13, color: T.textSub, fontFamily: 'DMSans_400Regular' },
  name: { fontSize: 20, fontWeight: '700', color: T.text, letterSpacing: -0.5, fontFamily: 'DMSans_700Bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: T.card,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },

  filtersScroll: { flexShrink: 0, marginTop: 14 },
  filters: { paddingHorizontal: 20, gap: 6, paddingBottom: 12 },

  feed: { paddingHorizontal: 20, paddingBottom: 100 },
  banner: {
    borderRadius: 24,
    padding: 14,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  bannerSub:  { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginBottom: 2, fontFamily: 'DMSans_500Medium' },
  bannerMain: { fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'DMSans_600SemiBold' },
});
