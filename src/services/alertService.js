/**
 * AgriTrace – Alert service
 * -------------------------
 * Owns everything that must outlive a single React component:
 *
 *  - Building a canonical critical-gas alert object from telemetry.
 *  - De-duplicating repeated MQTT/REST events for the same sequence or
 *    alert id (the core defence against duplicate emergency screens).
 *  - Persisting alert history + acknowledgement state locally so it
 *    survives app restarts and is available offline.
 *  - Acknowledging against the backend, falling back to an offline
 *    `pendingAcknowledgement` queue that is synced when connectivity
 *    returns.
 *
 * This service deliberately does NOT import React. The AlertContext
 * orchestrates UI and calls into here.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

import { acknowledgeAlert as acknowledgeAlertApi, getAlert as getAlertApi, getAlerts as getAlertsApi } from "../api/alertApi";
import { STORAGE_KEYS } from "./storage";
import { normalizeBackendAlert } from "../utils/apiMappers";
import {
  gasSeverity,
  ALERT_SEVERITY,
  isCriticalGas,
} from "../constants/alertThresholds";

/** Status values stored on an alert record. */
export const ALERT_STATUS = {
  ACTIVE: "ACTIVE",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  PENDING_ACKNOWLEDGEMENT: "PENDING_ACKNOWLEDGEMENT",
};

const HISTORY_LIMIT = 200;

/** In-memory mirror of persisted state, hydrated lazily. */
let alertHistory = [];
let hydrated = false;

/** Per-session dedupe guard (survives restarts via persisted statuses). */
const seenSequenceKeys = new Set();

/* ------------------------------------------------------------------ *
 * Keys
 * ------------------------------------------------------------------ */

/**
 * Builds a stable identity for a telemetry sample so duplicate
 * MQTT/API deliveries of the *same* reading collapse into one alert.
 *
 * Preference order:
 *   1. explicit telemetry sequence / alert id
 *   2. deviceId + timestamp
 *   3. deviceId + gas level (last resort, still prevents rapid dupes)
 */
export function buildAlertKey({
  alertId,
  sequence,
  deviceId,
  occurredAt,
  gasLevel,
} = {}) {
  if (alertId) return `alert:${alertId}`;
  if (sequence !== undefined && sequence !== null) {
    return `seq:${deviceId || "?"}:${sequence}`;
  }
  if (occurredAt) return `ts:${deviceId || "?"}:${occurredAt}`;
  return `gas:${deviceId || "?"}:${gasLevel}`;
}

/* ------------------------------------------------------------------ *
 * Persistence
 * ------------------------------------------------------------------ */

async function hydrate() {
  if (hydrated) return;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ALERT_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) alertHistory = parsed;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn("[alertService] hydrate failed:", error?.message);
    }
  } finally {
    hydrated = true;
  }
}

async function persist() {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.ALERT_HISTORY,
      JSON.stringify(alertHistory.slice(0, HISTORY_LIMIT)),
    );
  } catch (error) {
    if (__DEV__) {
      console.warn("[alertService] persist failed:", error?.message);
    }
  }
}

/** Returns a shallow copy of the stored alert history (newest first). */
export async function getAlertHistory() {
  await hydrate();
  return [...alertHistory];
}

export async function getAlertById(alertId) {
  await hydrate();
  return alertHistory.find((a) => a.id === alertId) || null;
}

/**
 * Fetch an alert from the BACKEND (single source of truth) and map it
 * into the canonical UI shape. Used by CriticalAlertScreen when a push
 * deep-links to us and we don't have the alert locally yet.
 *
 * Returns the canonical alert, or null when the backend does not have it.
 */
export async function fetchAlertFromBackend(alertId) {
  if (!alertId) return null;

  const raw = await getAlertApi(alertId);
  const canonical = normalizeBackendAlert(raw);
  if (!canonical?.id) return null;

  // Cache it locally so the screen and history work offline afterwards.
  await hydrate();
  const existingIndex = alertHistory.findIndex((a) => a.id === canonical.id);
  if (existingIndex >= 0) {
    // Preserve any local acknowledgement state that the backend hasn't
    // reflected yet (offline-first).
    const local = alertHistory[existingIndex];
    alertHistory[existingIndex] = {
      ...canonical,
      status: local.pendingAcknowledgement ? local.status : canonical.status,
      acknowledgedBy: local.acknowledgedBy || canonical.acknowledgedBy,
      acknowledgedAt: local.acknowledgedAt || canonical.acknowledgedAt,
    };
  } else {
    alertHistory = [canonical, ...alertHistory].slice(0, HISTORY_LIMIT);
  }
  await persist();

  return alertHistory.find((a) => a.id === canonical.id) || canonical;
}

/** Fetches the backend alert feed (for the Alerts list screen). */
export async function fetchAlertsFromBackend(filters = {}) {
  const result = await getAlertsApi(filters);
  const list = Array.isArray(result?.alerts) ? result.alerts : Array.isArray(result) ? result : [];
  return list.map(normalizeBackendAlert).filter((a) => a && a.id);
}

/** Clears local alert state on logout. */
export async function clearAlertState() {
  alertHistory = [];
  seenSequenceKeys.clear();
  hydrated = true;

  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ALERT_HISTORY,
      STORAGE_KEYS.PENDING_ACKS,
    ]);
  } catch (error) {
    if (__DEV__) {
      console.warn("[alertService] clear failed:", error?.message);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Building alerts from telemetry
 * ------------------------------------------------------------------ */

/**
 * Normalises a telemetry sample into a canonical alert record.
 * Never claims the MQ-3 value is validated ethylene ppm — it is
 * explicitly labelled as a RAW value.
 */
export function buildCriticalGasAlert(telemetry = {}) {
  const deviceId = telemetry.deviceId || telemetry.device_id || "UNKNOWN";
  const shipmentId = telemetry.shipmentId || telemetry.shipment_id || null;
  const gasLevel = Number(
    telemetry.gasLevel ?? telemetry.gas_level ?? telemetry.gas ?? NaN,
  );
  const occurredAt =
    telemetry.timestamp || telemetry.recordedAt || new Date().toISOString();

  const alertId =
    telemetry.alertId ||
    telemetry.alert_id ||
    buildAlertKey({
      sequence: telemetry.sequence ?? telemetry.seq,
      deviceId,
      occurredAt,
      gasLevel,
    });

  return {
    id: alertId,
    alertId,
    type: "CRITICAL_GAS_LEVEL",
    severity: ALERT_SEVERITY.CRITICAL,
    title: "Critical Gas Level",
    // Raw, calibrated sensor response — NOT validated ethylene ppm.
    gasLevel: Number.isFinite(gasLevel) ? gasLevel : null,
    gasUnit: "RAW",
    deviceId,
    shipmentId,
    shipmentName: telemetry.shipmentName || telemetry.shipment?.name || null,
    temperature:
      telemetry.temperature !== undefined ? telemetry.temperature : null,
    humidity: telemetry.humidity !== undefined ? telemetry.humidity : null,
    location: telemetry.location || telemetry.locationName || null,
    occurredAt,
    createdAt: occurredAt,
    status: ALERT_STATUS.ACTIVE,
    acknowledgedBy: null,
    acknowledgedAt: null,
    pendingAcknowledgement: false,
    message:
      "Gas level has exceeded the configured critical threshold. This may " +
      "indicate increased spoilage risk. Inspect the shipment and storage " +
      "conditions immediately.",
  };
}

/**
 * Ingests a telemetry sample.
 *
 * Returns one of:
 *   { action: "opened",  alert }  → brand-new critical alert, raise UI
 *   { action: "updated", alert }  → same alert refreshed, do NOT reopen
 *   { action: "ignored", alert: null, severity }
 *
 * Duplicate protection: the alert key is checked both against the
 * in-session set and against persisted history (so a re-delivered MQTT
 * message after an app restart does not reopen an acknowledged alert).
 */
export async function ingestTelemetry(telemetry = {}) {
  await hydrate();

  const severity = gasSeverity(
    telemetry.gasLevel ?? telemetry.gas_level ?? telemetry.gas,
  );

  if (
    !isCriticalGas(telemetry.gasLevel ?? telemetry.gas_level ?? telemetry.gas)
  ) {
    return { action: "ignored", alert: null, severity };
  }

  const candidate = buildCriticalGasAlert(telemetry);
  const key = candidate.id;

  const existing = alertHistory.find((a) => a.id === key);

  if (existing) {
    // Already known. Refresh the live readings but never re-open.
    if (existing.status === ALERT_STATUS.ACTIVE) {
      existing.temperature = candidate.temperature;
      existing.humidity = candidate.humidity;
      existing.gasLevel = candidate.gasLevel;
      existing.occurredAt = candidate.occurredAt;
      await persist();
    }
    return { action: "updated", alert: existing, severity };
  }

  if (seenSequenceKeys.has(key)) {
    return { action: "updated", alert: null, severity };
  }

  seenSequenceKeys.add(key);

  alertHistory = [candidate, ...alertHistory].slice(0, HISTORY_LIMIT);
  await persist();

  return { action: "opened", alert: candidate, severity };
}

/**
 * Flips an alert to ACKNOWLEDGED locally (optimistic) and records who
 * acknowledged it and when.
 */
export async function markAcknowledgedLocally(
  alertId,
  { acknowledgedBy = null, pending = false } = {},
) {
  await hydrate();

  const target = alertHistory.find((a) => a.id === alertId);
  if (!target) return null;

  target.status = pending
    ? ALERT_STATUS.PENDING_ACKNOWLEDGEMENT
    : ALERT_STATUS.ACKNOWLEDGED;
  target.pendingAcknowledgement = pending;
  target.acknowledgedBy = acknowledgedBy;
  target.acknowledgedAt = new Date().toISOString();

  await persist();
  return target;
}

/* ------------------------------------------------------------------ *
 * Acknowledgement + offline sync
 * ------------------------------------------------------------------ */

/** Payload stored in the offline acknowledgement queue. */
function buildAckPayload(alert, acknowledgedBy) {
  return {
    alertId: alert?.id || null,
    deviceId: alert?.deviceId || null,
    shipmentId: alert?.shipmentId || null,
    acknowledgedBy: acknowledgedBy || null,
    acknowledgedAt: new Date().toISOString(),
  };
}

async function readPendingAcks() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ACKS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePendingAcks(list) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACKS, JSON.stringify(list));
  } catch (error) {
    if (__DEV__) {
      console.warn(
        "[alertService] pending ack persist failed:",
        error?.message,
      );
    }
  }
}

/**
 * Attempts to acknowledge against the backend.
 * On failure the acknowledgement is queued for later sync and the alert
 * is marked PENDING_ACKNOWLEDGEMENT locally (never lost).
 *
 * Returns { synced: boolean, pending: boolean, payload }.
 */
export async function acknowledgeAlert(alert, { acknowledgedBy = null } = {}) {
  await hydrate();

  if (!alert?.id) {
    return { synced: false, pending: false, payload: null };
  }

  const payload = buildAckPayload(alert, acknowledgedBy);

  // Fast-path: if we already know we're offline, queue immediately.
  let online = true;
  try {
    const net = await NetInfo.fetch();
    online = net?.isConnected !== false;
  } catch {
    online = true; // Assume online and let the API call decide.
  }

  if (online) {
    try {
      await acknowledgeAlertApi(alert.id, { acknowledgedBy });
      await markAcknowledgedLocally(alert.id, {
        acknowledgedBy,
        pending: false,
      });
      return { synced: true, pending: false, payload };
    } catch (error) {
      if (__DEV__) {
        console.warn(
          "[alertService] backend ack failed, queueing:",
          error?.message,
        );
      }
    }
  }

  // Offline or backend failure → queue for later sync.
  const queue = await readPendingAcks();
  const alreadyQueued = queue.some((item) => item.alertId === alert.id);
  if (!alreadyQueued) {
    queue.push(payload);
    await writePendingAcks(queue);
  }

  await markAcknowledgedLocally(alert.id, {
    acknowledgedBy,
    pending: true,
  });

  return { synced: false, pending: true, payload };
}

/**
 * Flushes any queued acknowledgements that could not reach the backend.
 * Safe to call on every reconnect / app foreground.
 *
 * Returns { synced: number, remaining: number }.
 */
export async function syncPendingAcknowledgements() {
  const queue = await readPendingAcks();
  if (queue.length === 0) return { synced: 0, remaining: 0 };

  const remaining = [];
  let synced = 0;

  for (const item of queue) {
    try {
      await acknowledgeAlertApi(item.alertId, { acknowledgedBy: item.acknowledgedBy });
      await markAcknowledgedLocally(item.alertId, {
        acknowledgedBy: item.acknowledgedBy,
        pending: false,
      });
      synced += 1;
    } catch {
      remaining.push(item);
    }
  }

  await writePendingAcks(remaining);
  return { synced, remaining: remaining.length };
}

/** Number of acknowledgements still waiting to reach the backend. */
export async function getPendingAcknowledgementCount() {
  const queue = await readPendingAcks();
  return queue.length;
}

export default {
  ALERT_STATUS,
  buildAlertKey,
  buildCriticalGasAlert,
  ingestTelemetry,
  getAlertHistory,
  getAlertById,
  fetchAlertFromBackend,
  fetchAlertsFromBackend,
  markAcknowledgedLocally,
  acknowledgeAlert,
  syncPendingAcknowledgements,
  getPendingAcknowledgementCount,
  clearAlertState,
};
