import apiClient, { unwrapEnvelope } from "./apiClient";

export async function verifyShipmentIntegrity(shipmentId) {
  return unwrapEnvelope(
    await apiClient.get(`/shipments/${encodeURIComponent(shipmentId)}/integrity/verify`)
  );
}

export async function createIntegrityCheckpoint(shipmentId) {
  return unwrapEnvelope(
    await apiClient.post(`/shipments/${encodeURIComponent(shipmentId)}/integrity/checkpoint`)
  );
}
