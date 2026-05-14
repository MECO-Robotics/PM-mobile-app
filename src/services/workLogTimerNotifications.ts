import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const WORK_LOG_TIMER_CHANNEL_ID = "work-log-timer";
const WORK_LOG_TIMER_REMINDER_KIND = "work-log-timer-reminder";
const WORK_LOG_TIMER_REMINDER_MINUTES = [30, 60, 90];

export type PersistedWorkLogTimerReminder = {
  elapsedMs: number;
  id: string;
  reminderNotificationIds: string[];
  startedAt: number;
};

function allowsNotificationDelivery(
  permissions: Notifications.NotificationPermissionsStatus,
) {
  return (
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

function isWorkLogTimerReminder(
  notification: Notifications.NotificationRequest,
) {
  return notification.content.data?.kind === WORK_LOG_TIMER_REMINDER_KIND;
}

async function getScheduledWorkLogTimerReminderIds() {
  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync();

  return scheduledNotifications
    .filter(isWorkLogTimerReminder)
    .map((notification) => notification.identifier);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureNotificationSetup() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(WORK_LOG_TIMER_CHANNEL_ID, {
      name: "Work timer reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const currentPermissions = await Notifications.getPermissionsAsync();

  if (allowsNotificationDelivery(currentPermissions)) {
    return true;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync();

  return allowsNotificationDelivery(requestedPermissions);
}

export async function cancelWorkLogTimerReminders(notificationIds: string[] = []) {
  const idsToCancel =
    notificationIds.length > 0
      ? notificationIds
      : await getScheduledWorkLogTimerReminderIds();

  await Promise.all(
    idsToCancel.map((notificationId) =>
      Notifications.cancelScheduledNotificationAsync(notificationId),
    ),
  );
}

export async function schedulePersistedWorkLogTimerReminders(
  timer: PersistedWorkLogTimerReminder,
) {
  const canNotify = await ensureNotificationSetup();

  if (!canNotify) {
    return [];
  }

  const scheduledIds: string[] = [];

  for (const minutes of WORK_LOG_TIMER_REMINDER_MINUTES) {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Work timer still running",
        body: `${minutes} minutes logged. Pause when you are ready to turn this into a work log.`,
        data: {
          elapsedMs: timer.elapsedMs,
          kind: WORK_LOG_TIMER_REMINDER_KIND,
          minutes,
          startedAt: timer.startedAt,
          timerId: timer.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutes * 60,
        channelId: WORK_LOG_TIMER_CHANNEL_ID,
      },
    });
    scheduledIds.push(notificationId);
  }

  return scheduledIds;
}

function numberFromNotificationData(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringFromNotificationData(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function restorePersistedWorkLogTimerReminder(): Promise<PersistedWorkLogTimerReminder | null> {
  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync();
  const timerReminders = scheduledNotifications.filter(isWorkLogTimerReminder);

  if (timerReminders.length === 0) {
    return null;
  }

  const timerId = stringFromNotificationData(
    timerReminders[0]?.content.data?.timerId,
  );
  const startedAt = numberFromNotificationData(
    timerReminders[0]?.content.data?.startedAt,
  );

  if (!timerId || startedAt === null) {
    return null;
  }

  const reminderNotificationIds = timerReminders
    .filter((notification) => notification.content.data?.timerId === timerId)
    .map((notification) => notification.identifier);

  return {
    elapsedMs:
      numberFromNotificationData(timerReminders[0]?.content.data?.elapsedMs) ?? 0,
    id: timerId,
    reminderNotificationIds,
    startedAt,
  };
}
