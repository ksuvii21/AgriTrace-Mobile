/**
 * AgriTrace – Alert context
 * -------------------------
 * Single source of truth for the live emergency-alert state.
 *
 * Responsibilities:
 *  - Hydrate persisted alert history on mount.
 *  - Act as the integration point for REAL telemetry: `processTelemetry`
 *    is called from the WebSocket telemetry stream (LiveMonitoring) and
 *    from REST polling.
 *  - Escalate a critical gas reading to the full-screen alert: sound +
 *    vibration + notification + "active alert" state.
 *  - Own acknowledgement: stop sound/vibration, mark locally, hit the
 *    backend (offline-safe), and expose the result to the UI.
 *  - Handle lifecycle: AppState foreground/background, logout teardown,
 *    and notification taps.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";

import * as alarmService from "../services/alarmService";
import * as vibrationService from "../services/vibrationService";
import * as alertService from "../services/alertService";
import {
  addNotificationResponseListener,
  addNotificationReceivedListener,
  configureNotificationHandler,
  getInitialNotificationTarget,
  getAlertTargetFromResponse,
  setupCriticalNotificationChannel,
  requestNotificationPermission,
  getPushRegistration,
  showCriticalGasNotification,
  dismissCriticalNotification,
} from "../services/notifications";
import { registerPushToken, unregisterPushToken } from "../api/deviceApi";
import { ALERT_STATUS } from "../services/alertService";

export const AlertContext = createContext(null);

export function AlertProvider({ children, currentUser = null, navigationRef = null }) {
  const [activeAlert, setActiveAlert] = useState(null);
  const [history, setHistory] = useState([]);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [vibrationEnabled, setVibrationEnabledState] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // Prevents re-entrant escalation when several telemetry frames land
  // in the same tick (duplicate MQTT bursts).
  const escalatingRef = useRef(false);

  // Holds the latest alert-opening callback so the notification-tap
  // effect (registered earlier) can call it without stale closures.
  const openCriticalFromTargetRef = useRef(null);

  /* ---------------- history hydration ---------------- */

  const refreshHistory = useCallback(async () => {
    const list = await alertService.getAlertHistory();
    setHistory(sortHistory(list));
    return list;
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      await refreshHistory();
      if (mounted) setHydrated(true);
    })();

    return () => {
      mounted = false;
    };
  }, [refreshHistory]);

  /* ---------------- escalation ---------------- */

  const raiseCriticalAlert = useCallback(
    async (alert) => {
      if (!alert) return;

      setActiveAlert(alert);

      if (soundEnabled) {
        await alarmService.startAlarm();
      }

      if (vibrationEnabled) {
        vibrationService.startVibration();
      }

      await showCriticalGasNotification(alert);
      await refreshHistory();
    },
    [refreshHistory, soundEnabled, vibrationEnabled]
  );

  /**
   * Feed REAL telemetry into the alert engine.
   * Call this from the WebSocket telemetry handler and REST polling.
   */
  const processTelemetry = useCallback(
    async (telemetry) => {
      if (!telemetry) return { action: "ignored" };

      if (escalatingRef.current) {
        // Another frame is mid-escalation — the service still de-dupes,
        // but avoid piling on UI work.
        return { action: "ignored" };
      }

      escalatingRef.current = true;

      try {
        const result = await alertService.ingestTelemetry(telemetry);

        if (result.action === "opened" && result.alert) {
          await raiseCriticalAlert(result.alert);
        } else if (result.action === "updated") {
          await refreshHistory();
        }

        return result;
      } finally {
        escalatingRef.current = false;
      }
    },
    [raiseCriticalAlert, refreshHistory]
  );

  /* ---------------- acknowledgement ---------------- */

  const acknowledgeActiveAlert = useCallback(async () => {
    const target = activeAlert;
    if (!target) return { synced: false, pending: false };

    // 1. silence immediately — feedback must be instant.
    alarmService.stopAlarm();
    vibrationService.stopVibration();

    // 2. persist + (attempt) backend acknowledgement.
    const result = await alertService.acknowledgeAlert(target, {
      acknowledgedBy: currentUser?.uid || currentUser?.email || null,
    });

    // 3. remove the emergency overlay; the record lives on in history.
    setActiveAlert(null);
    await dismissCriticalNotification();
    await refreshHistory();

    return result;
  }, [activeAlert, currentUser, refreshHistory]);

  /**
   * Acknowledge a specific alert from history (Alert Details screen).
   */
  const acknowledgeById = useCallback(
    async (alertId) => {
      const target =
        (activeAlert && activeAlert.id === alertId ? activeAlert : null) ||
        (await alertService.getAlertById(alertId));

      if (!target) return { synced: false, pending: false };

      if (activeAlert && activeAlert.id === alertId) {
        return acknowledgeActiveAlert();
      }

      const result = await alertService.acknowledgeAlert(target, {
        acknowledgedBy: currentUser?.uid || currentUser?.email || null,
      });

      await refreshHistory();
      return result;
    },
    [activeAlert, acknowledgeActiveAlert, currentUser, refreshHistory]
  );

  /* ---------------- toggles ---------------- */

  const setSoundEnabled = useCallback((enabled) => {
    setSoundEnabledState(enabled);

    if (!enabled) {
      alarmService.setMuted(true);
    } else {
      alarmService.setMuted(false);
    }
  }, []);

  const setVibrationEnabled = useCallback((enabled) => {
    setVibrationEnabledState(enabled);
    vibrationService.setVibrationMuted(!enabled);
  }, []);

  /* ---------------- lifecycle ---------------- */

  useEffect(() => {
    configureNotificationHandler();
    setupCriticalNotificationChannel();
    requestNotificationPermission();
  }, []);

  // Foreground/background: keep the alarm audible when returning, and
  // make sure the emergency UI is still the one the user sees.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        if (soundEnabled) alarmService.resumeAlarmIfNeeded();
        if (vibrationEnabled && activeAlert) vibrationService.startVibration();
      }
    });

    return () => subscription.remove();
  }, [activeAlert, soundEnabled, vibrationEnabled]);

  // Re-sync acknowledgements that were queued while offline.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state?.isConnected) {
        alertService.syncPendingAcknowledgements().then(({ synced }) => {
          if (synced > 0) refreshHistory();
        });
      }
    });

    return () => unsubscribe();
  }, [refreshHistory]);

  // Notification tap → open the exact alert.
  useEffect(() => {
    const goToAlert = (alertId, response) => {
      // Prefer the full deep-link target (alertId + deviceId + shipmentId)
      // and route to the dedicated CriticalAlertScreen.
      const target = response ? getAlertTargetFromResponse(response) : { alertId };
      if (!target?.alertId) return;

      // Raise the alert locally so the global overlay appears even if the
      // navigator is not ready yet (e.g. cold start).
      openCriticalFromTargetRef.current?.(target);

      if (!navigationRef?.isReady?.()) return;
      navigationRef.navigate("CriticalAlert", {
        alertId: target.alertId,
        deviceId: target.deviceId,
        shipmentId: target.shipmentId,
      });
    };

    const unsubscribe = addNotificationResponseListener(goToAlert);

    return unsubscribe;
  }, [navigationRef]);

  /**
   * Load the REAL alert from the backend and raise the critical screen.
   * Used both for foreground push events and for notification taps that
   * deep-link straight to CriticalAlertScreen with alertId/deviceId/
   * shipmentId.
   */
  const openCriticalFromTarget = useCallback(
    async (target = {}) => {
      const { alertId, deviceId, shipmentId } = target || {};
      if (!alertId) return null;

      // 1. Try the backend (source of truth).
      let alert = null;
      try {
        alert = await alertService.fetchAlertFromBackend(alertId);
        await refreshHistory();
      } catch (error) {
        if (__DEV__) {
          console.warn("[alertContext] backend fetch failed:", error?.message);
        }
      }

      // 2. Fall back to a local record, then to the push payload.
      if (!alert) alert = await alertService.getAlertById(alertId);
      if (!alert) {
        alert = {
          id: alertId,
          alertId,
          severity: "CRITICAL",
          title: "Critical Gas Level",
          deviceId: deviceId || null,
          shipmentId: shipmentId || null,
          status: ALERT_STATUS.ACTIVE,
          occurredAt: new Date().toISOString(),
        };
      }

      // 3. Only escalate genuinely ACTIVE alerts (never re-alarm an
      //    already-acknowledged one).
      if (alert.status !== ALERT_STATUS.ACTIVE) {
        refreshHistory();
        return alert;
      }

      await raiseCriticalAlert(alert);
      return alert;
    },
    [raiseCriticalAlert, refreshHistory]
  );

  // Keep the ref pointed at the current implementation for early effects.
  useEffect(() => {
    openCriticalFromTargetRef.current = openCriticalFromTarget;
  }, [openCriticalFromTarget]);

  // FOREGROUND critical push → raise the emergency UI immediately,
  // regardless of which normal screen the user is on.
  useEffect(() => {
    const unsubscribe = addNotificationReceivedListener((data) => {
      openCriticalFromTarget(data);
    });
    return unsubscribe;
  }, [openCriticalFromTarget]);

  // Cold start straight from a push (app was closed) → deep-link.
  useEffect(() => {
    const target = getInitialNotificationTarget();
    if (target?.alertId) {
      // Defer until the container is ready.
      const timer = setTimeout(() => openCriticalFromTarget(target), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [openCriticalFromTarget]);

  /* ---------------- push token registration ---------------- */

  /**
   * Register this device's push token with the EXISTING backend so the
   * backend can deliver high-priority critical alerts when the app is
   * closed / backgrounded / the phone is locked.
   */
  const registerForPush = useCallback(async () => {
    try {
      const reg = await getPushRegistration();
      if (!reg?.granted) return null;

      const token = reg.expoPushToken || reg.devicePushToken;
      if (!token) return null;

      await registerPushToken({
        token,
        expoPushToken: reg.expoPushToken,
        devicePushToken: reg.devicePushToken,
        platform: reg.platform,
      });

      return token;
    } catch (error) {
      if (__DEV__) {
        console.warn("[alertContext] push registration failed:", error?.message);
      }
      return null;
    }
  }, []);

  // Register whenever a user is signed in; unregister on sign-out.
  useEffect(() => {
    if (!currentUser) return undefined;

    let cancelled = false;

    (async () => {
      const token = await registerForPush();
      if (cancelled && token) {
        await unregisterPushToken(token);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser, registerForPush]);

  // Logout / user switch must never leave an alarm running.
  useEffect(() => {
    if (currentUser) return;
    alarmService.disposeAlarm();
    vibrationService.disposeVibration();
  }, [currentUser]);

  // Unmount safety net.
  useEffect(
    () => () => {
      alarmService.disposeAlarm();
      vibrationService.disposeVibration();
    },
    []
  );

  /* ---------------- development helper ---------------- */

  /**
   * DEV ONLY. Ask the EXISTING backend to run a synthetic critical reading
   * through the real pipeline (MQTT-consumer-equivalent), so the SAME
   * alert-creation + push flow is exercised without raising physical gas.
   *
   * Falls back to the local alert engine when the backend endpoint is not
   * available yet.
   */
  const triggerTestCriticalAlert = useCallback(
    async ({ deviceId = "AGRITRACE-001", gasLevel = 4127, shipmentId = null } = {}) => {
      if (!__DEV__) return null;

      try {
        const { triggerTestCriticalAlert: triggerApi } = await import(
          "../api/alertApi"
        );
        const result = await triggerApi({ deviceId, gasLevel });
        return { action: result?.alertAction || "created", backend: result };
      } catch (error) {
        if (__DEV__) {
          console.warn(
            "[alertContext] backend test trigger unavailable, using local engine:",
            error?.message
          );
        }
      }

      // Local fallback so the dev button still demonstrates the flow.
      const telemetry = {
        deviceId,
        gasLevel,
        shipmentId,
        sequence: `dev-${Date.now()}`,
        timestamp: new Date().toISOString(),
        temperature: 28.4,
        humidity: 76,
      };

      return processTelemetry(telemetry);
    },
    [processTelemetry]
  );

  const value = useMemo(
    () => ({
      hydrated,
      activeAlert,
      hasActiveAlert: !!activeAlert,
      history,
      soundEnabled,
      vibrationEnabled,
      processTelemetry,
      raiseCriticalAlert,
      openCriticalFromTarget,
      registerForPush,
      acknowledgeActiveAlert,
      acknowledgeById,
      setSoundEnabled,
      setVibrationEnabled,
      refreshHistory,
      triggerTestCriticalAlert,
    }),
    [
      hydrated,
      activeAlert,
      history,
      soundEnabled,
      vibrationEnabled,
      processTelemetry,
      raiseCriticalAlert,
      openCriticalFromTarget,
      registerForPush,
      acknowledgeActiveAlert,
      acknowledgeById,
      setSoundEnabled,
      setVibrationEnabled,
      refreshHistory,
      triggerTestCriticalAlert,
    ]
  );

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

/**
 * Critical + unacknowledged first, then most recent.
 * `AlertSeverityBadge`/list consumers rely on this ordering.
 */
function sortHistory(list) {
  const rank = (alert) => {
    const critical = alert.severity === "CRITICAL";
    const active = alert.status !== ALERT_STATUS.ACKNOWLEDGED;
    if (critical && active) return 0;
    if (active) return 1;
    if (critical) return 2;
    return 3;
  };

  return [...list].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;

    const aTime = new Date(a.acknowledgedAt || a.occurredAt || 0).getTime();
    const bTime = new Date(b.acknowledgedAt || b.occurredAt || 0).getTime();
    return bTime - aTime;
  });
}

/** Access the alert context. Throws when used outside the provider. */
export function useAlerts() {
  const context = useContext(AlertContext);

  if (context === undefined || context === null) {
    throw new Error("useAlerts must be used inside AlertProvider");
  }

  return context;
}

export default AlertContext;