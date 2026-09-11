import apiClient, { unwrapEnvelope } from "./apiClient";

export async function getDashboardSummary() {
  return unwrapEnvelope(await apiClient.get("/dashboard/summary"));
}
