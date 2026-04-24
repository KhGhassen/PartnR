import { Tabs, router } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { T } from '../../constants/tokens';

type TabName = 'index' | 'match' | 'messages' | 'profile';

const TAB_ITEMS: { name: TabName; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'index',    label: 'Discover',  icon: 'compass-outline',       iconActive: 'compass' },
  { name: 'match',    label: 'For You',   icon: 'heart-outline',          iconActive: 'heart' },
  { name: 'messages', label: 'Messages',  icon: 'chatbubble-outline',     iconActive: 'chatbubble' },
  { name: 'profile',  label: 'Profile',   icon: 'person-outline',         iconActive: 'person' },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index]?.name as TabName;

  const left = TAB_ITEMS.slice(0, 2);
  const right = TAB_ITEMS.slice(2, 4);

  const renderTab = (item: (typeof TAB_ITEMS)[number]) => {
    const focused = currentRoute === item.name;
    return (
      <TouchableOpacity
        key={item.name}
        onPress={() => navigation.navigate(item.name)}
        activeOpacity={0.75}
        style={styles.tab}
      >
        <Ionicons
          name={focused ? item.iconActive : item.icon}
          size={22}
          color={focused ? T.coral : T.textSub}
        />
        <Text style={[styles.tabLabel, { color: focused ? T.coral : T.textSub }]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom || 12 }]}>
      <View style={styles.side}>{left.map(renderTab)}</View>

      {/* Center FAB */}
      <View style={styles.fabWrapper}>
        <TouchableOpacity
          onPress={() => router.push('/create')}
          activeOpacity={0.82}
          style={styles.fab}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.side}>{right.map(renderTab)}</View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="match" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: T.card,
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  side: {
    flex: 1,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 4,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
  },
  fabWrapper: {
    width: 64,
    alignItems: 'center',
    marginBottom: 4,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: T.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: T.coral,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    transform: [{ translateY: -12 }],
  },
});
