import React from "react";
import Badge from "../common/Badge";
import { shipmentBadgeType, statusLabel } from "../../utils/statusUtils";

export default function ShipmentStatus({ status }) {
  return <Badge text={statusLabel(status)} type={shipmentBadgeType(status)} />;
}
