import { auth } from "../config/firebase";
import { APP_CONFIG } from "../constants/config";

export async function createAuthenticatedSocket({
  onOpen,
  onMessage,
  onClose,
  onError,
} = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("User is not authenticated");

  const token = await user.getIdToken();
  const separator = APP_CONFIG.wsUrl.includes("?") ? "&" : "?";
  const ws = new WebSocket(`${APP_CONFIG.wsUrl}${separator}token=${encodeURIComponent(token)}`);

  ws.onopen = (event) => onOpen?.(event, ws);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage?.(data, ws);
    } catch {
      onMessage?.({ type: "raw", data: event.data }, ws);
    }
  };

  ws.onclose = (event) => onClose?.(event, ws);
  ws.onerror = (event) => onError?.(event, ws);

  return ws;
}

export function subscribeToShipment(ws, shipmentId) {
  if (ws?.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify({
    type: "shipment.subscribe",
    shipmentId,
  }));
  return true;
}

export function unsubscribeFromShipment(ws, shipmentId) {
  if (ws?.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify({
    type: "shipment.unsubscribe",
    shipmentId,
  }));
  return true;
}
