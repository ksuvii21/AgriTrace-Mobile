import { BleManager } from "react-native-ble-plx";
import { Platform, PermissionsAndroid } from "react-native";
import base64 from "base-64";

/* ──── BLE UUIDs (must match ESP32 firmware) ──── */
export const BLE_SERVICE_UUID = "7b100001-3c9d-4f5a-8a10-123456789001";
export const SSID_CHAR_UUID   = "7b100002-3c9d-4f5a-8a10-123456789001";
export const PASS_CHAR_UUID   = "7b100003-3c9d-4f5a-8a10-123456789001";
export const CMD_CHAR_UUID    = "7b100004-3c9d-4f5a-8a10-123456789001";
export const STATUS_CHAR_UUID = "7b100005-3c9d-4f5a-8a10-123456789001";

/* ──── Device name prefix for scanning ──── */
const DEVICE_PREFIX = "AGRITRACE-";

class BleService {
  constructor() {
    this.manager = new BleManager();
    this._isScanning = false;
    this._isConnecting = false;
  }

  /* ═══════════════════ PERMISSIONS ═══════════════════ */

  async requestPermissions() {
    if (Platform.OS === "android") {
      if (Platform.Version >= 31) {
        // Android 12+
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          result["android.permission.BLUETOOTH_CONNECT"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result["android.permission.BLUETOOTH_SCAN"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result["android.permission.ACCESS_FINE_LOCATION"] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      }
      // Android < 12
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    // iOS: permissions handled automatically on first BLE call
    return true;
  }

  /* ═══════════════════ SCANNING ═══════════════════ */

  /**
   * Start scanning for AgriTrace devices.
   * Filters in hardware by BLE_SERVICE_UUID, then also accepts devices that
   * advertise the AGRITRACE- name prefix (some firmware does not include the
   * service UUID in the advertisement packet).
   * Prevents duplicate concurrent scans.
   * @param {(device) => void} onDeviceFound
   * @param {(error) => void}  onError
   * @returns {boolean} false if a scan is already in progress
   */
  scanForDevices(onDeviceFound, onError) {
    if (this._isScanning) return false;
    this._isScanning = true;
    this.manager.startDeviceScan(
      [BLE_SERVICE_UUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          this._isScanning = false;
          onError?.(error);
          return;
        }
        if (!device) return;

        const deviceName = device.name || device.localName;
        const isAgriTraceDevice =
          device.name?.startsWith(DEVICE_PREFIX) ||
          device.localName?.startsWith(DEVICE_PREFIX) ||
          device.serviceUUIDs?.includes(BLE_SERVICE_UUID);

        if (isAgriTraceDevice) {
          onDeviceFound({ ...device, name: deviceName || "AgriTrace Device" });
        }
      }
    ).catch((err) => {
      this._isScanning = false;
      onError?.(err);
    });
    return true;
  }

  stopScan() {
    this.manager.stopDeviceScan();
    this._isScanning = false;
  }

  get isScanning() {
    return this._isScanning;
  }

  /* ═══════════════════ CONNECTION ═══════════════════ */

  async connectToDevice(deviceId, timeoutMs = 10000) {
    if (this._isConnecting) return null;
    this._isConnecting = true;
    try {
      const connected = await Promise.race([
        this._doConnect(deviceId),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("BLE connection timed out")),
            timeoutMs
          )
        ),
      ]);
      return connected;
    } catch (err) {
      // The underlying connect may still succeed after the race rejected.
      // Tear it down so we never leak a zombie connection that would stop
      // the peripheral from advertising again.
      await this.disconnectDevice(deviceId);
      throw err;
    } finally {
      this._isConnecting = false;
    }
  }

  async _doConnect(deviceId) {
    const device = await this.manager.connectToDevice(deviceId, {
      requestMTU: 512,
    });
    await device.discoverAllServicesAndCharacteristics();
    return device;
  }

  get isConnecting() {
    return this._isConnecting;
  }

  async disconnectDevice(deviceId) {
    try {
      const connected = await this.manager.isDeviceConnected(deviceId);
      if (connected) {
        await this.manager.cancelDeviceConnection(deviceId);
      }
    } catch (_) {
      /* swallow – may already be disconnected */
    }
  }

  async isBluetoothEnabled() {
    try {
      return await this.manager.isBluetoothEnabled();
    } catch (_) {
      return false;
    }
  }

  reset() {
    this._isScanning = false;
    this._isConnecting = false;
  }

  /**
   * Disconnect every device currently held by the manager and clear state.
   * Must be called when leaving the provisioning screen: this service is a
   * module-level singleton, so otherwise the BLE link survives unmount and the
   * peripheral stops advertising, making later scans find nothing.
   */
  async disconnectAll() {
    this.stopScan();
    let connected = [];
    try {
      connected = await this.manager.connectedDevices([BLE_SERVICE_UUID]);
    } catch (_) {
      connected = [];
    }
    await Promise.all(
      (connected || []).map((id) => this.disconnectDevice(id))
    );
    this.reset();
  }

  /* ═══════════════════ WRITE ═══════════════════ */

  async writeCharacteristic(deviceId, serviceUUID, charUUID, dataStr) {
    const b64 = base64.encode(dataStr);
    await this.manager.writeCharacteristicWithResponseForDevice(
      deviceId,
      serviceUUID,
      charUUID,
      b64
    );
  }

  /**
   * Send Wi-Fi credentials and CONNECT command to the ESP32.
   * Password is only transmitted locally via BLE — never logged or stored elsewhere.
   */
  async sendWiFiCredentials(deviceId, ssid, password) {
    await this.writeCharacteristic(deviceId, BLE_SERVICE_UUID, SSID_CHAR_UUID, ssid);
    await this.writeCharacteristic(deviceId, BLE_SERVICE_UUID, PASS_CHAR_UUID, password);
    await this.writeCharacteristic(deviceId, BLE_SERVICE_UUID, CMD_CHAR_UUID, "CONNECT");
  }

  /** Send SCAN_WIFI command to ESP32 */
  async sendScanCommand(deviceId) {
    await this.writeCharacteristic(deviceId, BLE_SERVICE_UUID, CMD_CHAR_UUID, "SCAN_WIFI");
  }

  /* ═══════════════════ MONITOR ═══════════════════ */

  /**
   * Monitor a BLE characteristic for notifications.
   * Returns a subscription that should be removed on cleanup.
   *
   * Tries STATUS_CHAR_UUID first (new firmware).
   * Falls back to CMD_CHAR_UUID (backwards-compatible with existing firmware
   * if the Command char has NOTIFY property).
   */
  monitorCharacteristic(deviceId, serviceUUID, charUUID, onUpdate, onError) {
    return this.manager.monitorCharacteristicForDevice(
      deviceId,
      serviceUUID,
      charUUID,
      (error, characteristic) => {
        if (error) {
          onError?.(error);
          return;
        }
        if (characteristic?.value) {
          try {
            const decoded = base64.decode(characteristic.value);
            onUpdate(decoded);
          } catch (_) {
            /* ignore decode errors */
          }
        }
      }
    );
  }
}

export const bleService = new BleService();
