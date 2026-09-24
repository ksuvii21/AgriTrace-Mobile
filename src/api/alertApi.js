import apiClient, { unwrapEnvelope } from "./apiClient";

export async function getAlerts(filters = {}) {
  const response = await apiClient.get("/alerts", { params: filters });
  return unwrapEnvelope(response);
}

export async function getAlert(alertId) {
  return unwrapEnvelope(await apiClient.get(`/alerts/${encodeURIComponent(alertId)}`));
}

/**
 * Acknowledge an alert. The backend flips ACTIVE → ACKNOWLEDGED and
 * records acknowledgedAt/acknowledgedBy. Acknowledged alerts are never
 * deleted — they remain in history.
 */
export async function acknowledgeAlert(alertId, payload = {}) {
  return unwrapEnvelope(
    await apiClient.patch(
      `/alerts/${encodeURIComponent(alertId)}/acknowledge`,
      payload
    )
  );
}

export async function resolveAlert(alertId) {
  return unwrapEnvelope(
    await apiClient.patch(`/alerts/${encodeURIComponent(alertId)}/resolve`)
  );
}

/**
 * DEV ONLY. Asks the backend to run a synthetic critical reading through
 * the SAME pipeline as a real MQTT message, so the notification flow can
 * be tested without physically raising gas on the sensor.
 *
 * Requires the backend to expose POST /alerts/test-critical (see
 * "BACKEND CHANGES REQUIRED"). Fails soft when the route is absent.
 */
export async function triggerTestCriticalAlert({ deviceId = "AGRITRACE-001", gasLevel = 4127 } = {}) {
  return unwrapEnvelope(
    await apiClient.post("/alerts/test-critical", { deviceId, gasLevel })
  );
}

export default {
  getAlerts,
  getAlert,
  acknowledgeAlert,
  resolveAlert,
  triggerTestCriticalAlert,
};
