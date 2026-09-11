import apiClient, { unwrapEnvelope } from "./apiClient";

export async function getDevices() {
  return unwrapEnvelope(await apiClient.get("/devices"));
}

export async function getDevice(deviceId) {
  return unwrapEnvelope(await apiClient.get(`/devices/${encodeURIComponent(deviceId)}`));
}

export async function getDeviceHealth(deviceId) {
  return unwrapEnvelope(await apiClient.get(`/devices/${encodeURIComponent(deviceId)}/health`));
}

export async function assignDevice(deviceId, shipmentId) {
  return unwrapEnvelope(
    await apiClient.post(`/devices/${encodeURIComponent(deviceId)}/assign`, { shipmentId })
  );
}
