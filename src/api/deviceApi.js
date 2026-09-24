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

/**
 * Register this device's push token with the existing backend so it can
 * deliver HIGH-PRIORITY critical alerts when the app is closed, the user
 * is on another screen, or the phone is locked.
 *
 * The token is owned by the authenticated user (the apiClient already
 * attaches the Firebase bearer token).
 *
 * Requires the backend to expose POST /users/push-token (see
 * "BACKEND CHANGES REQUIRED"). Fails soft when the route is absent so a
 * missing endpoint never blocks login.
 */
export async function registerPushToken({ token, expoPushToken, devicePushToken, platform, deviceId = null }) {
  const body = {
    token: token || expoPushToken || devicePushToken || null,
    expoPushToken: expoPushToken || null,
    devicePushToken: devicePushToken || null,
    platform: platform || null,
    deviceName: deviceId,
  };

  if (!body.token) return null;

  return unwrapEnvelope(await apiClient.post("/users/push-token", body));
}

/** Remove a push token (called on logout so the device stops alerting). */
export async function unregisterPushToken(token) {
  if (!token) return null;
  try {
    return unwrapEnvelope(await apiClient.delete("/users/push-token", { data: { token } }));
  } catch {
    return null;
  }
}

export default {
  getDevices,
  getDevice,
  getDeviceHealth,
  assignDevice,
  registerPushToken,
  unregisterPushToken,
};
