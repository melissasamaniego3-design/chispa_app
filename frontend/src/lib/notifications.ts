import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function ensureDailyReminder(enabled: boolean) {
  try {
    if (Platform.OS === 'web') return;

    if (!enabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    const settings = await Notifications.getPermissionsAsync();
    if (settings.status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      if (req.status !== 'granted') return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✨ Chispa diaria',
        body: 'Tu reto creativo de hoy ya te está esperando.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 10,
        minute: 0,
      } as any,
    });
  } catch (e) {
    // notifications are best-effort; ignore failures (e.g. on Expo Go)
    console.log('notifications setup skipped', e);
  }
}
