export const APP_CONFIG = {
  name: "AgriTrace",
  tagline: "Trace Every Harvest. Trust Every Journey.",

  splashDuration: 1600,

  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.10:5000/api",

  socketUrl:
    process.env.EXPO_PUBLIC_SOCKET_URL ||
    "http://192.168.1.10:5000",
};

export const ROLES = {
  admin: "Operations Manager",
  farmer: "Farmer",
  transporter: "Transporter",
  warehouse: "Warehouse Manager",
  retailer: "Retailer",
};

export const SHIPMENT_STATUS = {
  IN_TRANSIT: "IN TRANSIT",
  DELIVERED: "DELIVERED",
  PICKUP_PENDING: "PICKUP PENDING",
  DELAYED: "DELAYED",
  ALERT: "ALERT",
};