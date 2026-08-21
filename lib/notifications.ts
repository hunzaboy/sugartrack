import { Platform } from 'react-native';

const REMINDER_CHANNEL_ID = 'sugartrack-reminders';
const REMINDER_IDENTIFIER = 'sugartrack-daily-reminder';
let isHandlerConfigured = false;

async function getNotifications() {
  const Notifications = await import('expo-notifications');
  if (!isHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    isHandlerConfigured = true;
  }
  return Notifications;
}

export async function ensureNotificationChannel(): Promise<void> {
  const Notifications = await getNotifications();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Blood Sugar Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = await getNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

export async function scheduleDailyReminder(time: string): Promise<void> {
  const Notifications = await getNotifications();
  await ensureNotificationChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: 'Time to check your blood sugar',
      body: 'Log a new reading in SugarTrack.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  const Notifications = await getNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
}
