import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider } from '../context/AppContext';
import { View } from 'react-native';
import { T } from '../constants/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    // The package doesn't ship a 600 weight; styles referencing SemiBold get Bold.
    DMSans_600SemiBold: DMSans_700Bold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: T.bg }} />;
  }

  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="map" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="activity/[id]" />
        <Stack.Screen name="chat/[id]" />
      </Stack>
    </AppProvider>
  );
}
