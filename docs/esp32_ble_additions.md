# AgriTrace ESP32 — BLE Wi-Fi Scan & Status Additions

This file documents the **minimal firmware additions** needed on the ESP32 side to support:

1. **`SCAN_WIFI` command** → ESP32 scans nearby networks and returns them
2. **Provisioning status feedback** → ESP32 notifies the app of connection result

These additions are designed to integrate into your existing NimBLE-based BLE provisioning code
**without breaking** the existing SSID/Password/CONNECT protocol.

## How to Integrate

- Add the new Status characteristic in your BLE service setup
- Extend your `onWrite()` callback for the Command characteristic
- The rest of your existing code (NVS, MQTT, sensors, etc.) stays unchanged

---

## 1. Add a New BLE Characteristic for Status Notifications

In your BLE service setup (where you create SSID, Password, Command chars),
add one more characteristic for **STATUS**:

- **UUID:** `7b100005-3c9d-4f5a-8a10-123456789001`
- **Properties:** `READ | NOTIFY`

This characteristic will be used by the app to receive:
- Wi-Fi scan results (`WIFI_LIST:[ ... ]`)
- Connection status (`CONNECTING`, `CONNECTED`, `FAILED`, etc.)

### Example NimBLE Code

```cpp
#define STATUS_CHAR_UUID "7b100005-3c9d-4f5a-8a10-123456789001"

BLECharacteristic *pStatusChar;

// In createService():
pStatusChar = pService->createCharacteristic(
  STATUS_CHAR_UUID,
  NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
);

// To send a status:
void sendBleStatus(const char* status) {
  pStatusChar->setValue(status);
  pStatusChar->notify();
}
```

---

## 2. Handle SCAN_WIFI Command

In your existing `onWrite()` callback for the Command characteristic
(UUID `7b100004`), add a handler for `"SCAN_WIFI"`:

```cpp
void onCommandWrite(const std::string& cmd) {
  if (cmd == "CONNECT") {
    // ... your existing CONNECT logic ...
  }
  else if (cmd == "SCAN_WIFI") {
    handleWifiScan();
  }
}
```

---

## 3. Wi-Fi Scan Implementation

```cpp
void handleWifiScan() {
  Serial.println("[BLE] Command: SCAN_WIFI");
  sendBleStatus("SCANNING");

  // Disconnect Wi-Fi temporarily if connected
  // (optional; scan works while connected on ESP32)
  WiFi.mode(WIFI_STA);
  int n = WiFi.scanNetworks();

  // Build JSON array: [{"ssid":"...","rssi":-55,"secure":true}, ...]
  String json = "[";
  for (int i = 0; i < n && i < 15; i++) {  // Limit to 15 networks (BLE MTU)
    if (i > 0) json += ",";
    json += "{\"ssid\":\"";
    json += WiFi.SSID(i);
    json += "\",\"rssi\":";
    json += String(WiFi.RSSI(i));
    json += ",\"secure\":";
    json += (WiFi.encryptionType(i) != WIFI_AUTH_OPEN) ? "true" : "false";
    json += "}";
  }
  json += "]";

  WiFi.scanDelete();

  // Send as: WIFI_LIST:[{"ssid":"GalaxyF41","rssi":-45,"secure":true},...]
  String payload = "WIFI_LIST:" + json;
  Serial.println("[BLE] Sending Wi-Fi list: " + String(n) + " networks");

  // NOTE: BLE characteristic max payload is ~512 bytes with NimBLE (negotiated MTU).
  // For large lists, you may need to chunk. For ≤15 networks this is usually fine.
  sendBleStatus(payload.c_str());
}
```

---

## 4. Connection Status Feedback

In your existing Wi-Fi connection logic (after receiving `CONNECT` command),
add status notifications so the app knows the result:

```cpp
void handleConnect() {
  Serial.println("[BLE] Command: CONNECT");

  // Read SSID and password from the BLE characteristics (your existing code)
  String ssid = ...; // from SSID characteristic
  String pass = ...; // from Password characteristic

  // Save to NVS (your existing code)
  preferences.putString("wifi_ssid", ssid);
  preferences.putString("wifi_pass", pass);
  Serial.println("[WiFi] Credentials saved to NVS.");

  // Notify app
  sendBleStatus("CONNECTING");

  // Attempt connection
  WiFi.begin(ssid.c_str(), pass.c_str());

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] Connected to: " + ssid);
    sendBleStatus("CONNECTED");
    // Your existing MQTT connection logic will take over from here
  } else {
    Serial.println("[WiFi] Connection FAILED");
    // Determine reason
    if (WiFi.status() == WL_NO_SSID_AVAIL) {
      sendBleStatus("NETWORK_NOT_FOUND");
    } else if (WiFi.status() == WL_CONNECT_FAILED) {
      sendBleStatus("INVALID_PASSWORD");
    } else {
      sendBleStatus("FAILED");
    }
  }
}
```

---

## 5. Summary of UUIDs

| Characteristic | UUID | Properties |
|---|---|---|
| Service | `7b100001-3c9d-4f5a-8a10-123456789001` | — |
| SSID | `7b100002-3c9d-4f5a-8a10-123456789001` | WRITE |
| Password | `7b100003-3c9d-4f5a-8a10-123456789001` | WRITE |
| Command | `7b100004-3c9d-4f5a-8a10-123456789001` | WRITE |
| **Status** ← NEW | `7b100005-3c9d-4f5a-8a10-123456789001` | READ \| NOTIFY |

### Commands

| Command | Description |
|---|---|
| `CONNECT` | Existing — connect to Wi-Fi |
| `SCAN_WIFI` | **New** — scan nearby networks |

### Status Values (sent via Status Char notify)

| Status | Meaning |
|---|---|
| `READY` | Device ready |
| `SCANNING` | Wi-Fi scan in progress |
| `WIFI_LIST:[{...}]` | Scan results JSON |
| `CONNECTING` | Attempting Wi-Fi connection |
| `CONNECTED` | Successfully connected |
| `FAILED` | Connection failed (generic) |
| `INVALID_PASSWORD` | Wrong password |
| `NETWORK_NOT_FOUND` | SSID not found |

---

## 6. Important Notes

- The Status characteristic is **separate** from the Command characteristic.
  The app writes to Command and reads/monitors Status.

- If you prefer to reuse the Command characteristic for both write and
  notify (some firmware does this), that also works — just make sure
  the Command char has `NOTIFY` property added. The React Native side
  currently monitors the Command char for backwards compatibility.
  If you add a separate Status char, update `bleService.js` to monitor
  the Status UUID instead.

- Wi-Fi scanning does **NOT** break sensor/GPS/LCD/battery operation.
  `WiFi.scanNetworks()` is non-destructive.

- The password is **NEVER** logged in Serial output for security.

- After successful `CONNECT`, your existing MQTT auto-connect logic
  should take over naturally.
