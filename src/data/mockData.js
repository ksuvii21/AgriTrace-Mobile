export const devices = [
  { id: "AGR-NODE-001", status: "Online", shipment: "AGR-SHP-001", battery: 82, lastSeen: "2 min ago", temp: 24.6 },
  { id: "AGR-NODE-002", status: "Available", shipment: null, battery: 94, lastSeen: "1 min ago", temp: 22.0 },
  { id: "AGR-NODE-003", status: "Warning", shipment: "AGR-SHP-002", battery: 41, lastSeen: "6 min ago", temp: 27.8 },
  { id: "AGR-NODE-004", status: "Offline", shipment: null, battery: 31, lastSeen: "38 min ago", temp: 19.4 },
  { id: "AGR-NODE-005", status: "Online", shipment: "AGR-SHP-004", battery: 76, lastSeen: "3 min ago", temp: 21.1 },
];

export const shipments = [
  { id: "AGR-SHP-001", product: "Fresh Tomatoes", quantity: "300 kg", source: "Varanasi", destination: "Delhi", status: "IN_TRANSIT", device: "AGR-NODE-001", temperature: 24.6, humidity: 68, gasStatus: "Safe", battery: 82, progress: 68, eta: "6 hr 20 min", farm: "ABC Organic Farm", category: "active" },
  { id: "AGR-SHP-002", product: "Fresh Mangoes", quantity: "500 kg", source: "Lucknow", destination: "Mumbai", status: "DELAYED", device: "AGR-NODE-003", temperature: 27.8, humidity: 74, gasStatus: "Safe", battery: 41, progress: 40, eta: "14 hr 10 min", farm: "Sunrise Growers Collective", category: "active" },
  { id: "AGR-SHP-003", product: "Potatoes", quantity: "1200 kg", source: "Prayagraj", destination: "Kanpur", status: "DELIVERED", device: "AGR-NODE-004", temperature: 19.7, humidity: 55, gasStatus: "Safe", battery: 34, progress: 100, eta: "Delivered", farm: "Ganga Valley Farms", category: "completed" },
  { id: "AGR-SHP-004", product: "Fresh Mangoes", quantity: "220 kg", source: "Lucknow", destination: "Kanpur", status: "PICKUP_PENDING", device: "AGR-NODE-005", temperature: 21.4, humidity: 60, gasStatus: "Safe", battery: 76, progress: 5, eta: "Pending pickup", farm: "Sunrise Growers Collective", category: "upcoming" },
  { id: "AGR-SHP-005", product: "Bananas", quantity: "450 kg", source: "Prayagraj", destination: "Varanasi", status: "ALERT", device: null, temperature: 33.4, humidity: 82, gasStatus: "Warning", battery: 58, progress: 45, eta: "2 hr 15 min", farm: "Ganga Valley Farms", category: "active" },
];

export const alertsSeed = [
  { id:"AL-101", severity:"Critical", type:"Environmental", title:"Temperature High", shipment:"AGR-SHP-005", detail:"Temperature reached 33.4°C · Safe Maximum 28°C", time:"8 min ago", resolved:false },
  { id:"AL-102", severity:"Device", type:"Device", title:"AGR-NODE-004 Offline", shipment:"AGR-NODE-004", detail:"Last synchronized 38 minutes ago", time:"38 min ago", resolved:false },
  { id:"AL-103", severity:"Warning", type:"Environmental", title:"Humidity High", shipment:"AGR-SHP-002", detail:"Humidity reached 74% · Safe Maximum 80%", time:"24 min ago", resolved:false },
  { id:"AL-104", severity:"Warning", type:"Environmental", title:"Battery Low", shipment:"AGR-NODE-003", detail:"Battery at 41%, consider swapping soon", time:"1 hr ago", resolved:false },
  { id:"AL-105", severity:"Critical", type:"Environmental", title:"Cold Chain Breach", shipment:"AGR-SHP-006", detail:"Temperature reached 31.9°C · Safe Maximum 28°C", time:"2 hr ago", resolved:true },
];

export const activity = [
  { icon:"truck-outline", text:"Shipment AGR-SHP-001 departed collection center.", time:"12 minutes ago" },
  { icon:"access-point", text:"Device AGR-NODE-001 synchronized data.", time:"18 minutes ago" },
  { icon:"check-circle-outline", text:"Shipment AGR-SHP-003 delivered successfully.", time:"1 hour ago" },
  { icon:"alert-outline", text:"Temperature alert raised on AGR-SHP-005.", time:"8 minutes ago" },
];

export const traceabilitySteps = [
  { title:"Batch Created", sub:"ABC Organic Farm, Varanasi", time:"05 Sep 2026 · 08:30 AM", status:"completed" },
  { title:"Quality Check", sub:"Passed grading inspection", time:"05 Sep 2026 · 10:15 AM", status:"completed" },
  { title:"Shipment Created", sub:"AGR-SHP-001", time:"06 Sep 2026 · 07:45 AM", status:"completed" },
  { title:"Device Assigned", sub:"AGR-NODE-001", time:"06 Sep 2026 · 07:50 AM", status:"completed" },
  { title:"Dispatched", sub:"Varanasi", time:"06 Sep 2026 · 08:15 AM", status:"completed" },
  { title:"Collection Center", sub:"Completed", time:"06 Sep 2026 · 09:40 AM", status:"completed" },
  { title:"Currently In Transit", sub:"Kanpur", time:"Live", status:"current" },
  { title:"Delhi Warehouse", sub:"Pending", time:"Expected 08 Sep 2026", status:"pending" },
  { title:"Retailer", sub:"Pending", time:"—", status:"pending" },
];

export const roleSummaries = {
  admin: [["4","Active Shipments"],["2","Today's Deliveries"],["1","Alerts"],["6","Connected Devices"]],
  farmer: [["3","Active Batches"],["2","My Shipments"],["1","Devices Assigned"],["5","Produce Types"]],
  transporter: [["2","Today's Deliveries"],["3","Assigned Shipments"],["1","Pickup Pending"],["1","Alerts"]],
  warehouse: [["3","Incoming Shipments"],["2","Arriving Today"],["18","In Storage"],["1","Alerts"]],
  retailer: [["2","Incoming Products"],["12","Received Products"],["1","Pending Verification"],["0","Alerts"]],
};
