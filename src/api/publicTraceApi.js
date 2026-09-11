import axios from "axios";
import { APP_CONFIG } from "../constants/config";

const publicClient = axios.create({
  baseURL: APP_CONFIG.apiUrl,
  timeout: 15000,
});

export async function getPublicTrace(trackingId) {
  const response = await publicClient.get(`/public/trace/${encodeURIComponent(trackingId)}`);
  return response.data?.data ?? response.data;
}

export function extractTrackingId(scannedValue) {
  if (!scannedValue) return "";
  const raw = String(scannedValue).trim();

  try {
    const url = new URL(raw);
    const pieces = url.pathname.split("/").filter(Boolean);
    return decodeURIComponent(pieces[pieces.length - 1] || "");
  } catch {
    return raw;
  }
}
