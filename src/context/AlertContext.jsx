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
  configureNotificationHandler,
  getInitialNotificationAlertId,
  setupCriticalNotificationChannel,
  requestNotificationPermission,
  showCriticalGasNotification,
  dismissCriticalNotification,
} from "../services/notifications";
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
    const goToAlert = (alertId) => {
      if (!alertId || !navigationRef?.isReady?.()) return;
      navigationRef.navigate("AlertDetails", { alertId });
    };

    const unsubscribe = addNotificationResponseListener(goToAlert);

    // Cold start from a notification.
    getInitialNotificationAlertId().then((alertId) => {
      if (alertId) goToAlert(alertId);
    });

    return unsubscribe;
  }, [navigationRef]);

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

  const triggerTestCriticalAlert = useCallback(
    async ({ deviceId = "AGRITRACE-001", gasLevel = 1520, shipmentId = null } = {}) => {
      if (!__DEV__) return null;

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