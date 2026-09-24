import { CRITICAL_GAS_THRESHOLD, gasSeverity, ALERT_SEVERITY } from "../constants/alertThresholds";

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

const toNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Pull the real sensor fields out of ONE backend telemetry sample,
 * tolerating the field-name aliases the backend may use.
 *
 * `gasLevel` is the RAW MQ response — NOT validated ethylene ppm.
 */
export function normalizeTelemetrySample(sample = {}) {
  const gasLevel = toNum(
    sample.gasLevel ?? sample.gas_level ?? sample.gas ?? sample.mq3
  );

  const temperature = toNum(
    sample.temperature ?? sample.temp ?? sample.tempC
  );
  const humidity = toNum(sample.humidity ?? sample.hum);
  const battery = toNum(sample.battery ?? sample.batteryLevel);

  const timestamp =
    sample.recordedAt || sample.timestamp || sample.time || sample.createdAt || null;

  const deviceId = sample.deviceId || sample.device_id || sample.device || "—";
  const shipmentId = sample.shipmentId || sample.shipment_id || null;

  const location =
    sample.location || sample.locationName || sample.place || null;

  const severity =
    sample.severity ||
    (gasLevel == null ? null : gasSeverity(gasLevel));

  return {
    deviceId,
    shipmentId,
    gasLevel,
    gasUnit: "RAW",
    gasSeverity: severity,
    isCriticalGas: severity === ALERT_SEVERITY.CRITICAL,
    temperature,
    humidity,
    battery,
    location,
    latitude: toNum(sample.latitude ?? sample.lat),
    longitude: toNum(sample.longitude ?? sample.lng ?? sample.lon),
    timestamp,
    raw: sample,
  };
}

/**
 * Build the per-device telemetry list shown in Shipment Details from
 * whatever the backend returned. Accepts a single sample or an array
 * (one latest sample per assigned device) and de-duplicates by device,
 * keeping the most recent reading per device.
 *
 * IMPORTANT: this only reshapes REAL backend data. It never fabricates
 * readings. When nothing is available the list is empty and the screen
 * shows an explicit "no telemetry" / error state.
 */
export function normalizeShipmentTelemetry(telemetry) {
  const list = !telemetry
    ? []
    : Array.isArray(telemetry)
    ? telemetry
    : [telemetry];

  const byDevice = new Map();

  list.filter(Boolean).forEach((sample) => {
    const norm = normalizeTelemetrySample(sample);
    const key = norm.deviceId || "—";
    const existing = byDevice.get(key);

    const normTime = norm.timestamp ? new Date(norm.timestamp).getTime() : 0;
    const existingTime = existing?.timestamp
      ? new Date(existing.timestamp).getTime()
      : 0;

    if (!existing || normTime >= existingTime) byDevice.set(key, norm);
  });

  return Array.from(byDevice.values());
}

export function normalizeShipment(doc = {}, telemetry = null) {
  // Real per-device telemetry samples from the backend.
  const samples = normalizeShipmentTelemetry(telemetry);

  // Prefer the newest sample as the "headline" reading.
  const primary =
    samples
      .slice()
      .sort(
        (a, b) =>
          new Date(b.timestamp || 0).getTime() -
          new Date(a.timestamp || 0).getTime()
      )[0] || null;

  const gasValue = primary ? primary.gasLevel : null;

  // Gas STATUS is derived from the centralized critical threshold, so a
  // critical reading always reads "Critical" here — never "Safe". The
  // per-shipment threshold (when present) only governs the Warning band.
  let gasStatus = "—";
  const shipmentGasMax = toNum(doc.thresholds?.gasLevel?.max);

  if (gasValue !== null) {
    if (gasValue >= CRITICAL_GAS_THRESHOLD) gasStatus = "Critical";
    else if (shipmentGasMax != null && gasValue > shipmentGasMax) gasStatus = "Warning";
    else gasStatus = "Safe";
  }

  const quantity =
    doc.quantity != null
      ? `${doc.quantity}${doc.unit ? ` ${doc.unit}` : ""}`
      : "—";

  // ALL devices assigned to the shipment (multi-device aware), keeping
  // the legacy single-device field working.
  const assignedDevices = Array.isArray(doc.assignedDevices)
    ? doc.assignedDevices
    : doc.assignedDevices
    ? [doc.assignedDevices]
    : doc.assignedDevice
    ? [doc.assignedDevice]
    : [];

  return {
    raw: doc,
    id: doc.shipmentId || doc.id || "—",
    trackingId: doc.trackingId || null,
    product: doc.product || doc.productName || "Agricultural Produce",
    quantity,
    source: doc.source || doc.origin || "—",
    destination: doc.destination || "—",
    status: doc.status || "PENDING",
    device: doc.assignedDevice || assignedDevices[0] || null,
    assignedDevices,

    // Headline readings (newest device sample).
    temperature: primary ? primary.temperature : toNum(doc.temperature),
    humidity: primary ? primary.humidity : toNum(doc.humidity),
    gasLevel: gasValue,
    gasUnit: "RAW",
    gasStatus,
    battery: primary ? primary.battery : toNum(doc.battery),
    location: primary ? primary.location : null,
    lastTelemetryAt: primary ? primary.timestamp : null,
    deviceId: primary ? primary.deviceId : doc.assignedDevice || null,

    // Full per-device list for the telemetry section.
    telemetry: samples,

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
/**
 * Map a BACKEND alert document into the canonical alert object the
 * critical-alert UI expects (the same shape alertService builds locally).
 *
 * The backend is the source of truth; this only renames fields so the UI
 * renders the real alert the notification pointed at. `gasLevel` stays
 * RAW — never presented as ethylene ppm.
 */
export function normalizeBackendAlert(doc = {}) {
  if (!doc) return null;

  const gasLevelRaw =
    doc.gasLevel ?? doc.gas_level ?? doc.gas ?? null;
  const gasLevel = gasLevelRaw == null ? null : Number(gasLevelRaw);

  const occurredAt =
    doc.occurredAt ||
    doc.lastOccurredAt ||
    doc.firstOccurredAt ||
    doc.createdAt ||
    doc.timestamp ||
    new Date().toISOString();

  const severity = String(doc.severity || "CRITICAL").toUpperCase();

  return {
    id: doc.alertId || doc.id || null,
    alertId: doc.alertId || doc.id || null,
    type: doc.type || "CRITICAL_GAS_LEVEL",
    severity,
    title: doc.title || "Critical Gas Level",

    gasLevel: Number.isFinite(gasLevel) ? gasLevel : null,
    gasUnit: doc.gasUnit || "RAW",

    deviceId: doc.deviceId || doc.device_id || null,
    shipmentId: doc.shipmentId || doc.shipment_id || null,
    shipmentName: doc.shipmentName || doc.shipment?.name || null,

    temperature: doc.temperature ?? null,
    humidity: doc.humidity ?? null,
    battery: doc.battery ?? null,
    location: doc.location || doc.locationName || null,

    occurredAt,
    createdAt: doc.createdAt || occurredAt,

    status: doc.status || "ACTIVE",
    acknowledgedBy: doc.acknowledgedBy || null,
    acknowledgedAt: doc.acknowledgedAt || null,

    message: doc.message || null,
    raw: doc,
  };
}

export default {
  categoryFromStatus,
  progressFromStatus,
  normalizeShipment,
  normalizeShipmentTelemetry,
  normalizeTelemetrySample,
  normalizeDevice,
  normalizeAlert,
  normalizeBackendAlert,
};