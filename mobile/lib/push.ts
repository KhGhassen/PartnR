import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import client from '../api/client';

// Show notifications received while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

// Requests permission, grabs the Expo push token and registers it with the
// API. Silently no-ops when unsupported (simulator, permission denied,
// Expo Go without a project id) — push simply stays off.
export async function registerForPush(): Promise<void> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    if (token) await client.post('/notifications/push-token', { token });
  } catch {
    // push unavailable in this environment
  }
}

// Routes notification taps to the related event screen.
export function listenForNotificationTaps(): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const eventId = response.notification.request.content.data?.eventId as string | undefined;
    if (eventId) router.push(`/activity/${eventId}`);
  });
  return () => sub.remove();
}
