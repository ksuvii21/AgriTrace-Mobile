export const APP_CONFIG = {
  name: "AgriTrace",
  tagline: "Trace Every Harvest. Trust Every Journey.",
  splashDuration: 1600,

  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.10:8000/api/v1",

  wsUrl:
    process.env.EXPO_PUBLIC_WS_URL ||
    "ws://192.168.1.10:8000",
};

export const ROLES = {
  ADMIN: "Operations Manager",
  FARMER: "Farmer",
  TRANSPORTER: "Transporter",
  WAREHOUSE: "Warehouse Manager",
};
