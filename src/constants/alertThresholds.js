/**
 * AgriTrace – Alert threshold configuration
 * -----------------------------------------
 * SINGLE SOURCE OF TRUTH for gas-driven (and future sensor-driven)
 * alert severity classification.
 *
 * IMPORTANT / SENSOR NOTE
 * -----------------------
 * The MQ-3 sensor currently reports a RAW / calibrated gas-response
 * value. It is NOT a validated ethylene ppm concentration. These
 * values are therefore PROTOTYPE thresholds and MUST be re-tuned
 * after proper sensor calibration and crop-specific validation.
 *
 * Do not scatter numeric thresholds through components — always
 * import from here so a single edit re-tunes the whole app.
 */

/**
 * DIAGNOSTIC / DISPLAY thresholds.
 *
 * The BACKEND is the single source of truth for whether a reading is
 * CRITICAL — it evaluates MQTT telemetry against its own
 * `CRITICAL_GAS_THRESHOLD` and is the ONLY thing that creates alerts.
 *
 * The mobile app uses this block purely to COLOUR a reading that the
 * backend already told us about (e.g. a shipment telemetry card going
 * red), and as an offline fallback for locally-observed WebSocket
 * telemetry. Keep `CRITICAL_MIN` aligned with the backend env var so a
 * reading never looks "safe" on screen while the backend has already
 * raised a critical alert for it.
 *
 * Override at build time with EXPO_PUBLIC_CRITICAL_GAS_THRESHOLD=1500.
 */
const _criticalMin = Number(
  process.env.EXPO_PUBLIC_CRITICAL_GAS_THRESHOLD
);

export const CRITICAL_GAS_THRESHOLD = Number.isFinite(_criticalMin)
  ? _criticalMin
  : 1500;

export const GAS_THRESHOLDS = {
  NORMAL_MAX: 500, // 0    – 500  → NORMAL
  CAUTION_MAX: 1000, // 501  – 1000 → CAUTION
  WARNING_MAX: CRITICAL_GAS_THRESHOLD - 1, // WARNING band below critical
  CRITICAL_MIN: CRITICAL_GAS_THRESHOLD, // >= this → CRITICAL
};

/**
 * Canonical severity keys. Keep uppercase — the backend and
 * existing `normalizeAlert` mapper both use uppercase severities.
 */
export const ALERT_SEVERITY = {
  NORMAL: "NORMAL",
  CAUTION: "CAUTION",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
};

/**
 * Visual + behavioural metadata per severity.
 * `color` / `soft` / `text` feed the AlertSeverityBadge and cards.
 * `escalation` drives sound + vibration intensity (1 = calm, 4 = emergency).
 */
export const ALERT_SEVERITY_META = {
  [ALERT_SEVERITY.NORMAL]: {
    key: ALERT_SEVERITY.NORMAL,
    label: "Normal",
    escalation: 1,
    color: "#2E9B72",
    soft: "#DCEEE4",
    text: "#145C46",
    icon: "checkmark-circle",
  },
  [ALERT_SEVERITY.CAUTION]: {
    key: ALERT_SEVERITY.CAUTION,
    label: "Caution",
    escalation: 2,
    color: "#E8A317",
    soft: "#FDF0DC",
    text: "#A16207",
    icon: "alert-circle",
  },
  [ALERT_SEVERITY.WARNING]: {
    key: ALERT_SEVERITY.WARNING,
    label: "Warning",
    escalation: 3,
    color: "#E8710A",
    soft: "#FDE7D6",
    text: "#9A3412",
    icon: "warning",
  },
  [ALERT_SEVERITY.CRITICAL]: {
    key: ALERT_SEVERITY.CRITICAL,
    label: "Critical",
    escalation: 4,
    color: "#DC4545",
    soft: "#FCE7E5",
    text: "#991B1B",
    icon: "alert",
  },
};

/**
 * Classify a raw gas reading into a severity.
 * Handles null / undefined / non-numeric input safely.
 */
export function gasSeverity(gasLevel) {
  const value = Number(gasLevel);

  if (!Number.isFinite(value)) {
    return ALERT_SEVERITY.NORMAL;
  }
  if (value >= GAS_THRESHOLDS.CRITICAL_MIN) return ALERT_SEVERITY.CRITICAL;
  if (value > GAS_THRESHOLDS.WARNING_MAX) return ALERT_SEVERITY.WARNING;
  if (value > GAS_THRESHOLDS.CAUTION_MAX) return ALERT_SEVERITY.CAUTION;
  return ALERT_SEVERITY.NORMAL;
}

/**
 * Returns true when a gas reading must escalate to the full-screen
 * critical alert.
 */
export function isCriticalGas(gasLevel) {
  return gasSeverity(gasLevel) === ALERT_SEVERITY.CRITICAL;
}

/** Convenience helper for UI theming. */
export function severityMeta(severity) {
  return (
    ALERT_SEVERITY_META[String(severity || "").toUpperCase()] ||
    ALERT_SEVERITY_META[ALERT_SEVERITY.NORMAL]
  );
}

export const ALERT_SEVERITY_ORDER = [
  ALERT_SEVERITY.CRITICAL,
  ALERT_SEVERITY.WARNING,
  ALERT_SEVERITY.CAUTION,
  ALERT_SEVERITY.NORMAL,
];

export default GAS_THRESHOLDS;