import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const WORK_LOG_TIMER_CHANNEL_ID = "work-log-timer";
const WORK_LOG_TIMER_REMINDER_KIND = "work-log-timer-reminder";
const WORK_LOG_TIMER_REMINDER_MINUTES = [30, 60, 90];

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

export async function scheduleWorkLogTimerReminders() {
  const canNotify = await ensureNotificationSetup();

  if (!canNotify) {
    return [];
  }

  return Promise.all(
    WORK_LOG_TIMER_REMINDER_MINUTES.map((minutes) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Work timer still running",
          body: `${minutes} minutes logged. Pause when you are ready to turn this into a work log.`,
          data: {
            kind: WORK_LOG_TIMER_REMINDER_KIND,
            minutes,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: minutes * 60,
          channelId: WORK_LOG_TIMER_CHANNEL_ID,
        },
      }),
    ),
  );
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
