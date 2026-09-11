export function categoryFromStatus(status) {
  if (status === "DELIVERED" || status === "CANCELLED") return "completed";
  if (["PENDING", "DEVICE_ASSIGNED", "READY_FOR_DISPATCH"].includes(status)) return "upcoming";
  return "active";
}

export function progressFromStatus(status) {
  return {
    PENDING: 10,
    DEVICE_ASSIGNED: 25,
    READY_FOR_DISPATCH: 40,
    IN_TRANSIT: 65,
    AT_WAREHOUSE: 85,
    DELIVERED: 100,
    CANCELLED: 0,
  }[status] ?? 0;
}

export function normalizeShipment(doc = {}, telemetry = null) {
  const gasMax = doc.thresholds?.gasLevel?.max;
  const gasValue = telemetry?.gasLevel ?? doc.gasLevel ?? null;

  let gasStatus = "—";
  if (gasValue !== null && gasValue !== undefined) {
    gasStatus = gasMax != null && gasValue > gasMax ? "Warning" : "Safe";
  }

  const quantity =
    doc.quantity != null
      ? `${doc.quantity}${doc.unit ? ` ${doc.unit}` : ""}`
      : "—";

  return {
    raw: doc,
    id: doc.shipmentId || doc.id || "—",
    trackingId: doc.trackingId || null,
    product: doc.product || doc.productName || "Agricultural Produce",
    quantity,
    source: doc.source || doc.origin || "—",
    destination: doc.destination || "—",
    status: doc.status || "PENDING",
    device: doc.assignedDevice || null,
    temperature: telemetry?.temperature ?? doc.temperature ?? null,
    humidity: telemetry?.humidity ?? doc.humidity ?? null,
    gasLevel: gasValue,
    gasStatus,
    battery: telemetry?.battery ?? doc.battery ?? null,
    progress: progressFromStatus(doc.status),
    eta: doc.eta || doc.deliveryDate || "—",
    farm: doc.pickupLocation || doc.source || doc.origin || "—",
    category: categoryFromStatus(doc.status),
    thresholds: doc.thresholds || {},
  };
}

export function normalizeDevice(doc = {}, health = null) {
  const source = health || doc;
  return {
    raw: doc,
    id: doc.deviceId || "—",
    status: String(source.status || doc.status || "OFFLINE")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase()),
    shipment: source.currentShipmentId || doc.currentShipmentId || null,
    battery: source.battery ?? doc.battery ?? null,
    lastSeen: source.lastSeenAt || doc.lastSeenAt || null,
    temp: source.latestTelemetry?.temperature ?? null,
    latestTelemetry: source.latestTelemetry || null,
    firmwareVersion: source.firmwareVersion || doc.firmwareVersion || null,
  };
}

export function normalizeAlert(doc = {}) {
  const severity = String(doc.severity || "WARNING").toUpperCase();
  const severityLabel =
    severity === "CRITICAL" ? "Critical" :
    severity === "DEVICE" ? "Device" :
    "Warning";

  return {
    raw: doc,
    id: doc.alertId || doc.id,
    severity: severityLabel,
    type: doc.type?.includes?.("DEVICE") ? "Device" : "Environmental",
    title: doc.title || String(doc.type || "Alert").replace(/_/g, " "),
    shipment: doc.shipmentId || doc.deviceId || "—",
    detail: doc.message || doc.detail || doc.description || "AgriTrace alert",
    time: doc.createdAt || doc.timestamp || "",
    resolved: doc.status === "RESOLVED",
    status: doc.status,
  };
}
