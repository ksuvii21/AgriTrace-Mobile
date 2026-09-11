import COLORS from "../constants/colors";

export function statusLabel(status = "") {
  return status.replace(/_/g, " ");
}

export function shipmentBadgeType(status) {
  if (status === "DELIVERED") return "success";
  if (status === "ALERT") return "critical";
  if (status === "DELAYED" || status === "PICKUP_PENDING") return "warning";
  return "transit";
}

export function deviceStatusColor(status) {
  switch (status) {
    case "Online": return COLORS.emerald;
    case "Available": return COLORS.blue;
    case "Warning": return COLORS.warning;
    default: return COLORS.critical;
  }
}

export function isTempWarning(value) {
  return value > 28 || value < 8;
}

export function isHumidityWarning(value) {
  return value > 80 || value < 40;
}
