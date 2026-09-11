import apiClient, { unwrapEnvelope } from "./apiClient";

export async function getAlerts(filters = {}) {
  const response = await apiClient.get("/alerts", { params: filters });
  return unwrapEnvelope(response);
}

export async function getAlert(alertId) {
  return unwrapEnvelope(await apiClient.get(`/alerts/${encodeURIComponent(alertId)}`));
}

export async function acknowledgeAlert(alertId) {
  return unwrapEnvelope(
    await apiClient.patch(`/alerts/${encodeURIComponent(alertId)}/acknowledge`)
  );
}

export async function resolveAlert(alertId) {
  return unwrapEnvelope(
    await apiClient.patch(`/alerts/${encodeURIComponent(alertId)}/resolve`)
  );
}
