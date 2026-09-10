const fs = require('fs');
const path = require('path');

const structure = [
  "src/api/apiClient.js", "src/api/authApi.js", "src/api/shipmentApi.js", "src/api/deviceApi.js", "src/api/telemetryApi.js", "src/api/alertApi.js",
  "src/components/common/Button.jsx", "src/components/common/Card.jsx", "src/components/common/Badge.jsx", "src/components/common/Loader.jsx", "src/components/common/EmptyState.jsx",
  "src/components/shipment/ShipmentCard.jsx", "src/components/shipment/ShipmentStatus.jsx",
  "src/components/device/DeviceCard.jsx", "src/components/device/SensorCard.jsx",
  "src/components/alerts/AlertCard.jsx",
  "src/screens/auth/LoginScreen.jsx", "src/screens/dashboard/DashboardScreen.jsx",
  "src/screens/shipments/ShipmentsScreen.jsx", "src/screens/shipments/ShipmentDetailsScreen.jsx", "src/screens/shipments/ScanShipmentScreen.jsx",
  "src/screens/devices/DevicesScreen.jsx", "src/screens/devices/DeviceDetailsScreen.jsx", "src/screens/devices/AssignDeviceScreen.jsx",
  "src/screens/monitoring/LiveMonitoringScreen.jsx", "src/screens/alerts/AlertsScreen.jsx", "src/screens/traceability/TraceabilityScreen.jsx",
  "src/navigation/AppNavigator.jsx", "src/navigation/AuthNavigator.jsx", "src/navigation/BottomTabs.jsx",
  "src/context/AuthContext.jsx", "src/context/SocketContext.jsx",
  "src/hooks/useAuth.js", "src/hooks/useShipments.js", "src/hooks/useTelemetry.js",
  "src/services/websocket.js", "src/services/storage.js", "src/services/notifications.js",
  "src/constants/config.js", "src/constants/colors.js",
  "src/utils/dateUtils.js", "src/utils/statusUtils.js"
];

structure.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, '');
  }
});

console.log('Project structure created successfully!');