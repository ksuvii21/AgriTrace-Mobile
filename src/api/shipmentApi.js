import apiClient, { unwrapEnvelope } from "./apiClient";

export async function getShipments() {
  return unwrapEnvelope(await apiClient.get("/shipments"));
}

export async function getShipment(shipmentId) {
  return unwrapEnvelope(await apiClient.get(`/shipments/${encodeURIComponent(shipmentId)}`));
}

export async function createShipment(payload) {
  return unwrapEnvelope(await apiClient.post("/shipments", payload));
}

export async function updateShipmentStatus(shipmentId, status) {
  return unwrapEnvelope(
    await apiClient.patch(`/shipments/${encodeURIComponent(shipmentId)}/status`, { status })
  );
}

export async function updateShipmentThresholds(shipmentId, thresholds) {
  return unwrapEnvelope(
    await apiClient.patch(`/shipments/${encodeURIComponent(shipmentId)}/thresholds`, { thresholds })
  );
}

export async function assignTransporter(shipmentId, transporterId) {
  return unwrapEnvelope(
    await apiClient.patch(`/shipments/${encodeURIComponent(shipmentId)}/assign-transporter`, { transporterId })
  );
}

export async function assignWarehouse(shipmentId, warehouseId) {
  return unwrapEnvelope(
    await apiClient.patch(`/shipments/${encodeURIComponent(shipmentId)}/assign-warehouse`, { warehouseId })
  );
}

export async function getEnvironmentSummary(shipmentId) {
  return unwrapEnvelope(
    await apiClient.get(`/shipments/${encodeURIComponent(shipmentId)}/environment-summary`)
  );
}

export async function getShipmentQr(shipmentId) {
  return unwrapEnvelope(
    await apiClient.get(`/shipments/${encodeURIComponent(shipmentId)}/qr`)
  );
}
