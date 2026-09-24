import apiClient from "./apiClient";

function params(filters = {}) {
  const q = {};
  if (filters.from) q.from = filters.from;
  if (filters.to) q.to = filters.to;
  if (filters.limit) q.limit = filters.limit;
  return q;
}

/**
 * Latest telemetry for a shipment.
 *
 * The backend is the single source of truth: it associates each stored
 * reading with the device's ACTIVE shipment. This endpoint is what makes
 * "telemetry visible in Live Monitoring" also visible in Shipment
 * Details — both read the same real data. No mock/derived values.
 *
 * The response is expected to be the { success, data } envelope. It may
 * be a single sample OR a list of per-device latest samples (a shipment
 * can carry several devices); callers normalise both via
 * `toTelemetryList`.
 */
export async function getLatestTelemetryByShipment(shipmentId) {
  const response = await apiClient.get(
    `/telemetry/shipment/${encodeURIComponent(shipmentId)}/latest`
  );
  return toTelemetryList(unwrapTelemetry(response.data));
}

export async function getTelemetryHistoryByShipment(shipmentId, filters = {}) {
  const response = await apiClient.get(
    `/telemetry/shipment/${encodeURIComponent(shipmentId)}/history`,
    { params: params(filters) }
  );
  return toTelemetryList(unwrapTelemetry(response.data));
}

export async function getLatestTelemetryByDevice(deviceId) {
  const response = await apiClient.get(
    `/telemetry/device/${encodeURIComponent(deviceId)}/latest`
  );
  return unwrapTelemetry(response.data);
}

export async function getTelemetryHistoryByDevice(deviceId, filters = {}) {
  const response = await apiClient.get(
    `/telemetry/device/${encodeURIComponent(deviceId)}/history`,
    { params: params(filters) }
  );
  return toTelemetryList(unwrapTelemetry(response.data));
}

/** Unwrap the backend { success, data } envelope, tolerating raw payloads. */
export function unwrapTelemetry(body) {
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return body.data;
  }
  return body;
}

/**
 * Normalise a telemetry endpoint response into a flat array of samples.
 * Accepts: a single sample, an array of samples, or envelope shapes such
 * as { latest: [...] }, { readings: [...] }, { telemetry: [...] }.
 */
export function toTelemetryList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  for (const key of ["latest", "readings", "telemetry", "samples", "items"]) {
    if (Array.isArray(data[key])) return data[key];
  }

  // Single sample object.
  if (data.deviceId || data.device_id || data.gasLevel !== undefined) {
    return [data];
  }

  return [];
}

export default {
  getLatestTelemetryByShipment,
  getTelemetryHistoryByShipment,
  getLatestTelemetryByDevice,
  getTelemetryHistoryByDevice,
  toTelemetryList,
};
