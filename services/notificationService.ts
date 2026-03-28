/**
 * notificationService.ts
 * CLIENT app — Push notification registration and management.
 * Saves Expo push tokens to the push_tokens table.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '../lib/supabase';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request permission and register the Expo push token.
 * Saves the token to `push_tokens` table associated with the current user.
 */
export async function registerPushToken(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('[Push] Skipping: not a physical device');
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Geral',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F05A28',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission not granted');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return token;

    // Upsert token to avoid duplicates
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: user.id,
          token,
          device: Platform.OS,
        },
        { onConflict: 'token' }
      );

    if (error) {
      console.error('[Push] Error saving token:', error.message);
    } else {
      console.log('[Push] Token registered:', token.slice(0, 30) + '...');
    }

    return token;
  } catch (err) {
    console.error('[Push] Error getting token:', err);
    return null;
  }
}

/**
 * Remove push token on logout so user stops receiving notifications.
 */
export async function removePushToken(): Promise<void> {
  if (!Device.isDevice) return;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    await supabase
      .from('push_tokens')
      .delete()
      .eq('token', token);

    console.log('[Push] Token removed on logout');
  } catch {
    // Ignore errors on logout
  }
}

/**
 * Subscribe to foreground notification events.
 * Returns an unsubscribe function.
 */
export function subscribeToForegroundNotifications(
  onNotification: (title: string, body: string, data: any) => void
): () => void {
  const sub = Notifications.addNotificationReceivedListener((notification) => {
    const { title, body, data } = notification.request.content;
    onNotification(title ?? '', body ?? '', data ?? {});
  });

  return () => sub.remove();
}
