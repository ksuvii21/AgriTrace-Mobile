/**
 * AgriTrace – Notification service
 * --------------------------------
 * High-priority "Critical Gas Level" notifications with an Android
 * Critical Alerts channel.
 *
 *  - Configures a foreground presentation handler.
 *  - Creates an Android channel with MAX importance, vibration and the
 *    bundled alarm sound so the notification behaves like an alarm
 *    even when the app is backgrounded/killed.
 *  - Exposes a tap-listener that routes to the exact alert screen.
 *
 * Only one critical notification is ever live at a time: this service
 * always dismisses the previous critical notification before posting a
 * new one.
 */

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

/** Stable channel id — changing it changes the user's channel settings. */
export const CRITICAL_CHANNEL_ID = "agritrace-critical-alerts";

/** Notification category carrying the "Acknowledge" quick action. */
export const CRITICAL_CATEGORY_ID = "AGRITRACE_CRITICAL_ALERT";

/** Notification payload key used to deep-link into Alert Details. */
export const ALERT_ID_PAYLOAD_KEY = "alertId";

let configured = false;
let lastCriticalNotificationId = null;

/**
 * Sets the foreground presentation behaviour. Called once at app start.
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      // On Android, `shouldPlaySound: false` suppresses the heads-up
      // banner entirely regardless of priority (per expo-notifications
      // docs), so this must stay true for the emergency alert to pop.
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Creates the Android notification channel + interactive category.
 * Safe to call repeatedly and on iOS (channel creation is Android-only).
 */
export async function setupCriticalNotificationChannel() {
  if (configured) return;
  configured = true;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CRITICAL_CHANNEL_ID, {
        name: "Critical Alerts",
        description:
          "Emergency gas / spoilage-risk alerts that require immediate action.",
        importance: Notifications.AndroidImportance.MAX,
        // vibrate → pause → vibrate → pause → longer vibrate
        vibrationPattern: [0, 500, 250, 1200],
        lightColor: "#DC4545",
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        enableVibrate: true,
        enableLights: true,
        // Base filename (with extension) resolved from app.json sounds.
        sound: "critical_alarm.wav",
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.ALARM,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        },
      });
    }

    await Notifications.setNotificationCategoryAsync(CRITICAL_CATEGORY_ID, [
      {
        identifier: "ACKNOWLEDGE",
        buttonTitle: "Acknowledge",
      },
      {
        identifier: "VIEW",
        buttonTitle: "View Details",
      },
    ]);
  } catch (error) {
    if (__DEV__) {
      console.warn("[notifications] setup failed:", error?.message);
    }
  }
}

/**
 * Registers the runtime notification permission request (Android 13+ / iOS).
 * Returns true when granted (or already granted).
 */
export async function requestNotificationPermission() {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;

    const next = await Notifications.requestPermissionsAsync();
    return !!next.granted;
  } catch (error) {
    if (__DEV__) {
      console.warn(
        "[notifications] permission request failed:",
        error?.message
      );
    }
    return false;
  }
}

/**
 * Posts (or reposts) the critical gas notification.
 *
 * `alert` is expected to already be normalised by alertService with at
 * least: { id, deviceId, shipmentId, gasLevel, occurredAt }.
 *
 * The notification is Android-"sticky" so it stays visible until the
 * alert is acknowledged/handled.
 */
export async function showCriticalGasNotification(alert) {
  if (!alert) return null;

  try {
    await setupCriticalNotificationChannel();

    // Never stack duplicates for the same alert.
    await dismissCriticalNotification();

    const gasLine = `Gas level: ${formatGas(alert.gasLevel)} (Raw Value)`;
    const deviceLine = `Device: ${alert.deviceId || "Unknown device"}`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "CRITICAL GAS LEVEL DETECTED",
        body: `${gasLine}\n${deviceLine}\nImmediate inspection required.`,
        data: {
          [ALERT_ID_PAYLOAD_KEY]: alert.id,
          deviceId: alert.deviceId || null,
          shipmentId: alert.shipmentId || null,
          type: "CRITICAL_GAS_ALERT",
        },
        categoryIdentifier: CRITICAL_CATEGORY_ID,
        sound: "critical_alarm.wav",
        sticky: Platform.OS === "android",
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === "android"
          ? { channelId: CRITICAL_CHANNEL_ID }
          : {}),
      },
      trigger: null, // deliver immediately
    });

    lastCriticalNotificationId = notificationId;
    return notificationId;
  } catch (error) {
    if (__DEV__) {
      console.warn(
        "[notifications] failed to show critical notification:",
        error?.message
      );
    }
    return null;
  }
}

/** Dismiss the currently tracked critical notification (best effort). */
export async function dismissCriticalNotification() {
  if (!lastCriticalNotificationId) return;

  try {
    await Notifications.dismissNotificationAsync(lastCriticalNotificationId);
  } catch {
    // Notification may already be gone — ignore.
  } finally {
    lastCriticalNotificationId = null;
  }
}

/**
 * Deep-link helper: extracts the alertId from a notification response.
 * Returns null when the payload does not represent a critical alert.
 */
export function getAlertIdFromResponse(response) {
  const data = response?.notification?.request?.content?.data;
  const alertId = data?.[ALERT_ID_PAYLOAD_KEY];
  return typeof alertId === "string" && alertId.length > 0 ? alertId : null;
}

/**
 * Subscribes to user taps on a notification (foreground + background).
 * `onOpen(alertId)` is invoked with the target alert id.
 * Returns an unsubscribe function.
 */
export function addNotificationResponseListener(onOpen) {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const alertId = getAlertIdFromResponse(response);
      if (alertId) onOpen(alertId, response);
    }
  );

  return () => {
    try {
      subscription.remove();
    } catch {
      // Ignore — listener already removed.
    }
  };
}

/** Returns the alertId if the app was cold-started from a notification. */
export async function getInitialNotificationAlertId() {
  try {
    const response = Notifications.getLastNotificationResponse();
    return getAlertIdFromResponse(response);
  } catch {
    return null;
  }
}

function formatGas(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(numeric) : "—";
}

export default {
  CRITICAL_CHANNEL_ID,
  CRITICAL_CATEGORY_ID,
  configureNotificationHandler,
  setupCriticalNotificationChannel,
  requestNotificationPermission,
  showCriticalGasNotification,
  dismissCriticalNotification,
  addNotificationResponseListener,
  getInitialNotificationAlertId,
  getAlertIdFromResponse,
};