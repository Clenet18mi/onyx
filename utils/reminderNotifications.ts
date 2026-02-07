// ============================================
// ONYX - Notifications locales pour les rappels
// ============================================

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

const REMINDER_CHANNEL_ID = 'onyx-reminders';

/** Configure le handler pour afficher les notifications même quand l'app est au premier plan */
export function setReminderNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Crée le canal Android pour les rappels (requis pour Android 8+) */
export async function ensureReminderChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Rappels ONYX',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }
}

/** Demande les permissions de notification. À appeler avant de planifier. */
export async function requestReminderPermissions(): Promise<boolean> {
  await ensureReminderChannel();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Planifie une notification locale pour un rappel à la date/heure donnée. */
export async function scheduleReminderNotification(
  reminderId: string,
  title: string,
  scheduledAt: string
): Promise<void> {
  const enabled = useSettingsStore.getState().notificationsEnabled;
  if (!enabled) return;

  const date = new Date(scheduledAt);
  if (date.getTime() <= Date.now()) return;

  await ensureReminderChannel();
  const trigger: Notifications.DateTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date,
    channelId: REMINDER_CHANNEL_ID,
  };
  await Notifications.scheduleNotificationAsync({
    identifier: reminderId,
    content: {
      title: 'Rappel ONYX',
      body: title,
      data: { reminderId },
      sound: true,
      channelId: REMINDER_CHANNEL_ID,
    },
    trigger,
  });
}

/** Annule la notification planifiée pour un rappel. */
export async function cancelReminderNotification(reminderId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(reminderId);
  } catch {
    // ignore
  }
}

/** Replanifie toutes les notifications des rappels à venir (au démarrage de l'app). */
export async function syncReminderNotifications(reminders: { id: string; title: string; scheduledAt: string; completed: boolean }[]): Promise<void> {
  const enabled = useSettingsStore.getState().notificationsEnabled;
  if (!enabled) return;

  await ensureReminderChannel();
  const now = new Date().toISOString();
  const upcoming = reminders.filter((r) => !r.completed && r.scheduledAt >= now);

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminderIds = new Set(upcoming.map((r) => r.id));
  for (const n of scheduled) {
    if (n.content.data?.reminderId && !reminderIds.has(n.content.data.reminderId as string)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  for (const r of upcoming) {
    const date = new Date(r.scheduledAt);
    if (date.getTime() <= Date.now()) continue;
    try {
      await Notifications.cancelScheduledNotificationAsync(r.id);
      await Notifications.scheduleNotificationAsync({
        identifier: r.id,
        content: {
          title: 'Rappel ONYX',
          body: r.title,
          data: { reminderId: r.id },
          sound: true,
          channelId: REMINDER_CHANNEL_ID,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: REMINDER_CHANNEL_ID,
        },
      });
    } catch (e) {
      console.warn('[reminderNotifications] schedule failed', r.id, e);
    }
  }
}
