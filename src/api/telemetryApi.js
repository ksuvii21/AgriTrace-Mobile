import apiClient from "./apiClient";

function params(filters = {}) {
  const q = {};
  if (filters.from) q.from = filters.from;
  if (filters.to) q.to = filters.to;
  if (filters.limit) q.limit = filters.limit;
  return q;
}

export async function getLatestTelemetryByShipment(shipmentId) {
  const response = await apiClient.get(`/telemetry/shipment/${encodeURIComponent(shipmentId)}/latest`);
  return response.data;
}

export async function getTelemetryHistoryByShipment(shipmentId, filters = {}) {
  const response = await apiClient.get(
    `/telemetry/shipment/${encodeURIComponent(shipmentId)}/history`,
    { params: params(filters) }
  );
  return response.data;
}

export async function getLatestTelemetryByDevice(deviceId) {
  const response = await apiClient.get(`/telemetry/device/${encodeURIComponent(deviceId)}/latest`);
  return response.data;
}

export async function getTelemetryHistoryByDevice(deviceId, filters = {}) {
  const response = await apiClient.get(
    `/telemetry/device/${encodeURIComponent(deviceId)}/history`,
    { params: params(filters) }
  );
  return response.data;
}
