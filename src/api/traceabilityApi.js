import apiClient from "./apiClient";

export async function getTimeline(shipmentId) {
  const response = await apiClient.get(`/shipments/${encodeURIComponent(shipmentId)}/timeline`);
  return response.data;
}

export async function addTimelineEvent(shipmentId, type, metadata = {}) {
  const response = await apiClient.post(`/shipments/${encodeURIComponent(shipmentId)}/timeline`, {
    type,
    metadata,
  });
  return response.data;
}
