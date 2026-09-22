import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "../../constants/colors";
import TopBar from "../../components/common/TopBar";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import WiFiNetworkItem from "../../components/WiFiNetworkItem";
import {
  bleService,
  BLE_SERVICE_UUID,
  STATUS_CHAR_UUID,
} from "../../services/bleService";

/* ──────────── Step constants ──────────── */
const STEP = {
  PERMISSIONS: "PERMISSIONS",
  SCANNING_BLE: "SCANNING_BLE",
  CONNECTING_BLE: "CONNECTING_BLE",
  CONNECTED_BLE: "CONNECTED_BLE",
  SCANNING_WIFI: "SCANNING_WIFI",
  SELECT_WIFI: "SELECT_WIFI",
  ENTER_PASSWORD: "ENTER_PASSWORD",
  PROVISIONING: "PROVISIONING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
};

const STEP_ORDER = [
  STEP.PERMISSIONS,
  STEP.SCANNING_BLE,
  STEP.CONNECTING_BLE,
  STEP.CONNECTED_BLE,
  STEP.SCANNING_WIFI,
  STEP.SELECT_WIFI,
  STEP.ENTER_PASSWORD,
  STEP.PROVISIONING,
  STEP.SUCCESS,
];

const ERROR_TYPE = {
  BLUETOOTH_OFF: "BLUETOOTH_OFF",
  NO_DEVICE: "NO_DEVICE",
  WIFI_FAILED: "WIFI_FAILED",
  DISCONNECTED: "DISCONNECTED",
  GENERIC: "GENERIC",
};

/* ──────────── Timeouts (ms) ──────────── */
const BLE_SCAN_TIMEOUT = 15000;
const WIFI_SCAN_TIMEOUT = 12000;
const BLE_CONNECTED_HOLD = 900;

export default function ConfigureDeviceScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const changeWifi = route.params?.changeWifi ?? false;

  const [step, setStep] = useState(STEP.PERMISSIONS);
  const [foundDevices, setFoundDevices] = useState([]);
  const [device, setDevice] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [manualSsid, setManualSsid] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorType, setErrorType] = useState(ERROR_TYPE.GENERIC);
  const [statusMsg, setStatusMsg] = useState("");
  const [bleScanDone, setBleScanDone] = useState(false);
  const [credsSent, setCredsSent] = useState(false);

  const scanTimer = useRef(null);
  const wifiTimer = useRef(null);
  const monitorSub = useRef(null);
  const connectedHoldTimer = useRef(null);
  const isMounted = useRef(true);
  const isProvisioning = useRef(false);

  /* ──── Lifecycle cleanup ──── */
  useEffect(() => {
    isMounted.current = true;
    startFlow();
    return () => {
      isMounted.current = false;
      isProvisioning.current = false;
      bleService.stopScan();
      clearTimeout(scanTimer.current);
      clearTimeout(wifiTimer.current);
      clearTimeout(connectedHoldTimer.current);
      monitorSub.current?.remove();
      if (device) bleService.disconnectDevice(device.id);
    };
  }, []);

  /* ──── Helpers ──── */
  const stepIndex = (s) => STEP_ORDER.indexOf(s);
  const stepAtLeast = (s) => stepIndex(step) >= stepIndex(s);

  /* ──── Error helper ──── */
  const setError = (msg, type = ERROR_TYPE.GENERIC) => {
    setErrorMsg(msg);
    setErrorType(type);
    setStep(STEP.ERROR);
  };

  /* ──── Main flow entry ──── */
  const startFlow = async () => {
    setStep(STEP.PERMISSIONS);
    setFoundDevices([]);
    setDevice(null);
    setNetworks([]);
    setSelectedNetwork(null);
    setPassword("");
    setErrorMsg("");
    setErrorType(ERROR_TYPE.GENERIC);
    setStatusMsg("");
    setBleScanDone(false);
    setCredsSent(false);
    monitorSub.current?.remove();
    isProvisioning.current = false;
    bleService.reset();

    const ok = await bleService.requestPermissions();
    if (!ok) {
      return setError(
        "Bluetooth permissions are required to configure your device.",
        ERROR_TYPE.GENERIC
      );
    }

    const btEnabled = await bleService.isBluetoothEnabled();
    if (!btEnabled) {
      return setError(
        "Bluetooth is turned off",
        ERROR_TYPE.BLUETOOTH_OFF
      );
    }

    startBleScan();
  };

  /* ──── BLE scan ──── */
  const startBleScan = () => {
    setStep(STEP.SCANNING_BLE);
    setFoundDevices([]);
    setBleScanDone(false);

    if (!bleService.scanForDevices(
      (dev) => {
        if (!isMounted.current) return;
        setFoundDevices((prev) => {
          if (prev.find((d) => d.id === dev.id)) return prev;
          return [...prev, dev];
        });
      },
      (err) => {
        if (!isMounted.current) return;
        setError("Device scan failed. Try again.", ERROR_TYPE.GENERIC);
      }
    )) {
      return;
    }

    scanTimer.current = setTimeout(() => {
      bleService.stopScan();
      if (isMounted.current) setBleScanDone(true);
    }, BLE_SCAN_TIMEOUT);
  };

  const restartBleScan = () => {
    clearTimeout(scanTimer.current);
    startBleScan();
  };

  /* ──── Select & connect to a device ──── */
  const selectDevice = async (dev) => {
    if (bleService.isConnecting) return;
    bleService.stopScan();
    clearTimeout(scanTimer.current);
    setDevice(dev);
    setStep(STEP.CONNECTING_BLE);

    try {
      const connected = await bleService.connectToDevice(dev.id);
      if (!connected) {
        if (!isMounted.current) return;
        setError(
          "Connection lost",
          ERROR_TYPE.DISCONNECTED
        );
        return;
      }

      setStep(STEP.CONNECTED_BLE);

      connectedHoldTimer.current = setTimeout(() => {
        if (!isMounted.current) return;
        setStep(STEP.SCANNING_WIFI);
        setStatusMsg("Requesting network scan from device…");
        bleService.sendScanCommand(dev.id);

        wifiTimer.current = setTimeout(() => {
          if (!isMounted.current) return;
          setStep((prev) => (prev === STEP.SCANNING_WIFI ? STEP.SELECT_WIFI : prev));
        }, WIFI_SCAN_TIMEOUT);
      }, BLE_CONNECTED_HOLD);

      monitorSub.current = bleService.monitorCharacteristic(
        dev.id,
        BLE_SERVICE_UUID,
        STATUS_CHAR_UUID,
        handleDeviceMessage,
        (err) => {
          if (!isMounted.current) return;
          console.log("Monitor error:", err.reason || err.message);
        }
      );
    } catch (err) {
      if (!isMounted.current) return;
      bleService.disconnectDevice(dev.id);
      setError("Connection lost. Move closer and retry.", ERROR_TYPE.DISCONNECTED);
    }
  };

  /* ──── Handle BLE notifications from ESP32 ──── */
  const handleDeviceMessage = useCallback((message) => {
    if (!isMounted.current) return;

    if (message.startsWith("WIFI_LIST:")) {
      clearTimeout(wifiTimer.current);
      try {
        const list = JSON.parse(message.slice(10));
        setNetworks(Array.isArray(list) ? list : []);
        setStep(STEP.SELECT_WIFI);
      } catch {
        setNetworks([]);
        setStep(STEP.SELECT_WIFI);
      }
      return;
    }

    switch (message) {
      case "CONNECTED":
        setStep(STEP.SUCCESS);
        break;
      case "FAILED":
        setError("Unable to connect to Wi-Fi", ERROR_TYPE.WIFI_FAILED);
        break;
      case "INVALID_PASSWORD":
        setError("Unable to connect to Wi-Fi", ERROR_TYPE.WIFI_FAILED);
        break;
      case "NETWORK_NOT_FOUND":
        setError("Unable to connect to Wi-Fi", ERROR_TYPE.WIFI_FAILED);
        break;
      case "CONNECTING":
        setStatusMsg("Device is connecting to Wi-Fi…");
        break;
      case "SCANNING":
        setStatusMsg("Device is scanning nearby networks…");
        break;
      case "READY":
        setStatusMsg("Device is ready.");
        break;
      default:
        setStatusMsg(message);
    }
  }, []);

  /* ──── Send credentials ──── */
  const startProvisioning = async () => {
    if (isProvisioning.current) return;
    isProvisioning.current = true;

    const ssid = selectedNetwork?.ssid || manualSsid;
    if (!ssid) {
      isProvisioning.current = false;
      return;
    }

    setStep(STEP.PROVISIONING);
    setCredsSent(false);
    setStatusMsg("Sending credentials to device…");

    try {
      await bleService.sendWiFiCredentials(device.id, ssid, password);
      setCredsSent(true);
      setStatusMsg("Credentials sent. Waiting for device to connect…");
    } catch (err) {
      if (!isMounted.current) return;
      isProvisioning.current = false;
      setError("Failed to send credentials. Try again.", ERROR_TYPE.GENERIC);
    }
  };

  /* ──── Refresh Wi-Fi scan ──── */
  const refreshWifi = async () => {
    if (!device) return;
    setNetworks([]);
    setStep(STEP.SCANNING_WIFI);
    setStatusMsg("Scanning…");
    try {
      await bleService.sendScanCommand(device.id);
      wifiTimer.current = setTimeout(() => {
        if (!isMounted.current) return;
        setStep((prev) => (prev === STEP.SCANNING_WIFI ? STEP.SELECT_WIFI : prev));
      }, WIFI_SCAN_TIMEOUT);
    } catch {
      setStep(STEP.SELECT_WIFI);
    }
  };

  /* ──── Error action handlers ──── */
  const handleErrorAction = () => {
    switch (errorType) {
      case ERROR_TYPE.BLUETOOTH_OFF:
      case ERROR_TYPE.NO_DEVICE:
        return restartBleScan();
      case ERROR_TYPE.WIFI_FAILED:
        return setStep(STEP.ENTER_PASSWORD);
      case ERROR_TYPE.DISCONNECTED:
        return startFlow();
      default:
        return startFlow();
    }
  };

  const getErrorActionLabel = () => {
    switch (errorType) {
      case ERROR_TYPE.BLUETOOTH_OFF:
      case ERROR_TYPE.NO_DEVICE:
        return "Scan Again";
      case ERROR_TYPE.WIFI_FAILED:
        return "Back";
      case ERROR_TYPE.DISCONNECTED:
        return "Retry";
      default:
        return "Retry";
    }
  };

  /* ════════════════════════════════════════════════════════════════
     RENDER HELPERS
     ════════════════════════════════════════════════════════════════ */

  /* ─── Header with progress ─── */
  const renderHeader = () => {
    if (step === STEP.SUCCESS || step === STEP.ERROR) return null;
    const steps = [
      { label: "Device", at: STEP.SCANNING_BLE },
      { label: "Wi-Fi", at: STEP.SCANNING_WIFI },
      { label: "Connect", at: STEP.PROVISIONING },
    ];
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Set Up AgriTrace</Text>
        <Text style={styles.headerSubtitle}>Connect your AgriTrace node to Wi-Fi</Text>
        <View style={styles.progressRow}>
          {steps.map((s, i) => (
            <View key={s.label} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View style={styles.progressStep}>
                <Text style={[styles.progressNum, stepAtLeast(s.at) && styles.progressNumActive]}>
                  {i + 1}
                </Text>
                <Text style={[styles.progressLabel, stepAtLeast(s.at) && styles.progressLabelActive]}>
                  {s.label}
                </Text>
              </View>
              {i < steps.length - 1 && (
                <View style={styles.progressArrow}>
                  <Ionicons name="chevron-forward" size={12} color={COLORS.border} />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  /* ─── Scanning BLE ─── */
  const renderScanningBle = () => (
    <View style={styles.centerFlex}>
      {!bleScanDone && (
        <>
          <View style={styles.scanIconWrap}>
            <Ionicons name="bluetooth" size={40} color={COLORS.green} />
            <ActivityIndicator size="small" color={COLORS.green} style={{ marginTop: 8 }} />
          </View>
          <Text style={styles.scanTitle}>Searching for nearby AgriTrace devices…</Text>
          {foundDevices.length > 0 && (
            <Text style={styles.scanCount}>{foundDevices.length} device{foundDevices.length !== 1 ? "s" : ""} found</Text>
          )}
          <TouchableOpacity style={styles.refreshBtnRow} onPress={restartBleScan}>
            <Ionicons name="refresh" size={14} color={COLORS.green} />
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </>
      )}
      {bleScanDone && foundDevices.length === 0 && (
        <>
          <Ionicons name="wifi-outline" size={40} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>No AgriTrace devices found</Text>
          <Text style={styles.emptySub}>Make sure your device is powered on and in setup mode.</Text>
          <Button title="Scan Again" onPress={restartBleScan} style={{ marginTop: 18, width: "100%" }} />
        </>
      )}
      {foundDevices.length > 0 && (
        <View style={{ width: "100%", marginTop: bleScanDone ? 18 : 0 }}>
          <Text style={styles.sectionLabel}>Found Devices</Text>
          {foundDevices.map((d) => (
            <TouchableOpacity
              key={d.id}
              activeOpacity={0.82}
              style={styles.bleDeviceCard}
              onPress={() => selectDevice(d)}
            >
              <View style={styles.bleIconWrap}>
                <Ionicons name="bluetooth" size={20} color={COLORS.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bleDeviceName}>AgriTrace Node</Text>
                <Text style={styles.bleDeviceId}>{d.name}</Text>
                <Text style={styles.bleDeviceSub}>Nearby • Ready to configure</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  /* ─── Connected BLE (brief success card) ─── */
  const renderConnectedBle = () => (
    <View style={styles.centerFlex}>
      <View style={styles.successCircle}>
        <Ionicons name="checkmark" size={40} color={COLORS.white} />
      </View>
      <Text style={styles.successTitle}>{device?.name}</Text>
      <Text style={styles.subStatus}>Bluetooth connection established</Text>
    </View>
  );

  /* ─── Scanning Wi-Fi ─── */
  const renderScanningWifi = () => (
    <View style={styles.centerFlex}>
      <Loader text="Scanning for nearby Wi-Fi networks (2.4 GHz)…" />
      {statusMsg ? <Text style={styles.subStatus}>{statusMsg}</Text> : null}
      <TouchableOpacity
        style={styles.ghostLink}
        onPress={() => setStep(STEP.SELECT_WIFI)}
      >
        <Text style={styles.ghostLinkText}>Enter network manually</Text>
      </TouchableOpacity>
    </View>
  );

  /* ─── Select Wi-Fi ─── */
  const renderSelectWifi = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Card style={styles.deviceBanner}>
        <View style={styles.bannerRow}>
          <View style={styles.bannerDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerName}>{device?.name}</Text>
            <Text style={styles.bannerSub}>Connected via Bluetooth</Text>
          </View>
        </View>
      </Card>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>Choose Wi-Fi</Text>
        <TouchableOpacity onPress={refreshWifi} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={16} color={COLORS.green} />
          <Text style={styles.refreshLabel}>Refresh</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.wifiSubtitle}>Select a 2.4 GHz network for your AgriTrace device.</Text>

      {networks.length > 0 ? (
        networks.map((n, idx) => (
          <WiFiNetworkItem
            key={n.ssid + idx}
            network={n}
            selected={selectedNetwork?.ssid === n.ssid}
            onPress={() => {
              setSelectedNetwork(n);
              setStep(STEP.ENTER_PASSWORD);
            }}
          />
        ))
      ) : (
        <Card style={{ marginBottom: 14 }}>
          <Text style={styles.emptyHint}>
            No networks received from device. You can enter the SSID manually.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Network name (SSID)"
            placeholderTextColor={COLORS.muted}
            value={manualSsid}
            onChangeText={setManualSsid}
            autoCapitalize="none"
          />
          <Button
            title="Next"
            onPress={() => {
              if (manualSsid.trim()) {
                setSelectedNetwork({ ssid: manualSsid.trim(), secure: true });
                setStep(STEP.ENTER_PASSWORD);
              }
            }}
            disabled={!manualSsid.trim()}
            style={{ marginTop: 12 }}
          />
        </Card>
      )}
    </ScrollView>
  );

  /* ─── Enter Password ─── */
  const renderEnterPassword = () => {
    const ssid = selectedNetwork?.ssid || "";
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.deviceBanner}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerName}>{device?.name}</Text>
              <Text style={styles.bannerSub}>Connected via Bluetooth</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>Wi-Fi Network</Text>
        <Card style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="wifi" size={18} color={COLORS.green} />
            <Text style={styles.selectedSsid}>{ssid}</Text>
          </View>
          <Text style={styles.selectedNetworkLabel}>Connected network selected</Text>
        </Card>

        <Text style={styles.sectionLabel}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter Wi-Fi password"
            placeholderTextColor={COLORS.muted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        </View>

        <Button
          title="Connect Device"
          onPress={startProvisioning}
          style={{ marginTop: 22 }}
        />
        <Button
          title="Back to Networks"
          variant="ghost"
          onPress={() => {
            setPassword("");
            setStep(STEP.SELECT_WIFI);
          }}
          style={{ marginTop: 10 }}
        />
      </ScrollView>
    );
  };

  /* ─── Provisioning ─── */
  const renderProvisioning = () => (
    <View style={styles.centerFlex}>
      <Text style={styles.provisionTitle}>Connecting AgriTrace</Text>
      <View style={styles.provisionList}>
        <View style={styles.provisionRow}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
          <Text style={styles.provisionItem}>Bluetooth connected</Text>
        </View>
        <View style={styles.provisionRow}>
          <Ionicons name={credsSent ? "checkmark-circle" : "ellipse"} size={18} color={credsSent ? COLORS.success : COLORS.muted} />
          <Text style={[styles.provisionItem, !credsSent && styles.provisionItemPending]}>Wi-Fi credentials sent</Text>
        </View>
        <View style={styles.provisionRow}>
          <Ionicons name={statusMsg.includes("connecting") ? "ellipse" : "ellipse-outline"} size={18} color={statusMsg.includes("connecting") ? COLORS.warning : COLORS.muted} />
          <Text style={[styles.provisionItem, !statusMsg.includes("connecting") && styles.provisionItemPending]}>Connecting to Wi-Fi…</Text>
        </View>
        <View style={styles.provisionRow}>
          <Ionicons name="ellipse-outline" size={18} color={COLORS.muted} />
          <Text style={[styles.provisionItem, styles.provisionItemPending]}>Connecting to cloud…</Text>
        </View>
      </View>
      {statusMsg ? <Text style={styles.subStatus}>{statusMsg}</Text> : null}
    </View>
  );

  /* ─── Success ─── */
  const renderSuccess = () => (
    <View style={styles.centerFlex}>
      <View style={styles.successCircle}>
        <Ionicons name="checkmark" size={40} color={COLORS.white} />
      </View>
      <Text style={styles.successTitle}>AgriTrace Connected</Text>
      <Text style={styles.subStatus}>
        {device?.name} is now connected to {selectedNetwork?.ssid || "your network"}.
      </Text>
      <Button
        title="Go to Device"
        onPress={() => navigation.navigate("DeviceDetails", { deviceId: device?.name })}
        style={{ marginTop: 28, width: "100%" }}
      />
      <Button
        title="Done"
        variant="ghost"
        onPress={() => navigation.goBack()}
        style={{ marginTop: 10, width: "100%" }}
      />
    </View>
  );

  /* ─── Error ─── */
  const renderError = () => {
    const errorConfig = {
      [ERROR_TYPE.BLUETOOTH_OFF]: {
        icon: "bluetooth",
        title: "Bluetooth is turned off",
        message: "Turn on Bluetooth to discover your AgriTrace device.",
      },
      [ERROR_TYPE.NO_DEVICE]: {
        icon: "wifi-outline",
        title: "No AgriTrace devices found",
        message: "Make sure your device is powered on and in setup mode.",
      },
      [ERROR_TYPE.WIFI_FAILED]: {
        icon: "wifi-outline",
        title: "Unable to connect to Wi-Fi",
        message: "Check the password and try again.",
      },
      [ERROR_TYPE.DISCONNECTED]: {
        icon: "warning-outline",
        title: "Connection lost",
        message: "Move closer to your AgriTrace device and retry.",
      },
      [ERROR_TYPE.GENERIC]: {
        icon: "close",
        title: "Something went wrong",
        message: errorMsg,
      },
    };
    const cfg = errorConfig[errorType] || errorConfig[ERROR_TYPE.GENERIC];

    return (
      <View style={styles.centerFlex}>
        <View style={styles.errorCircle}>
          <Ionicons name={cfg.icon} size={36} color={COLORS.white} />
        </View>
        <Text style={styles.errorTitle}>{cfg.title}</Text>
        <Text style={styles.subStatus}>{cfg.message}</Text>
        <Button
          title={getErrorActionLabel()}
          onPress={handleErrorAction}
          style={{ marginTop: 28, width: "100%" }}
        />
        <Button
          title="Cancel"
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 10, width: "100%" }}
        />
      </View>
    );
  };

  /* ════════════ MAIN RENDER ════════════ */
  const stepContent = {
    [STEP.PERMISSIONS]: () => <Loader text="Checking permissions…" />,
    [STEP.SCANNING_BLE]: renderScanningBle,
    [STEP.CONNECTING_BLE]: () => <Loader text={`Connecting to ${device?.name || "device"}…`} />,
    [STEP.CONNECTED_BLE]: renderConnectedBle,
    [STEP.SCANNING_WIFI]: renderScanningWifi,
    [STEP.SELECT_WIFI]: renderSelectWifi,
    [STEP.ENTER_PASSWORD]: renderEnterPassword,
    [STEP.PROVISIONING]: renderProvisioning,
    [STEP.SUCCESS]: renderSuccess,
    [STEP.ERROR]: renderError,
  };

  return (
    <View style={styles.screen}>
      <TopBar
        title={changeWifi ? "Change Wi-Fi" : "Configure Device"}
        navigation={navigation}
      />
      <View style={[styles.body, { paddingBottom: insets.bottom + 18 }]}>
        {renderHeader()}
        {(stepContent[step] || (() => null))()}
      </View>
    </View>
  );
}

/* ════════════════════════ STYLES ════════════════════════ */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  body: {
    flex: 1,
    padding: 18,
  },
  centerFlex: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* ─── Header ─── */
  header: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 18,
  },
  headerTitle: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
    color: COLORS.muted,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressStep: {
    alignItems: "center",
    flex: 1,
  },
  progressNum: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 16,
    color: COLORS.border,
  },
  progressNumActive: {
    color: COLORS.green,
  },
  progressLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  progressLabelActive: {
    color: COLORS.green,
  },
  progressArrow: {
    paddingHorizontal: 4,
  },

  /* ─── Scanning ─── */
  scanIconWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
  scanTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 4,
  },
  scanCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 12,
  },
  refreshBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  refreshBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: COLORS.green,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 24,
  },

  /* ─── BLE device list ─── */
  sectionLabel: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  bleDeviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  bleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  bleDeviceName: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: COLORS.text,
  },
  bleDeviceId: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: COLORS.green,
    marginTop: 1,
  },
  bleDeviceSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11.5,
    color: COLORS.muted,
    marginTop: 1,
  },

  /* ─── Connected device banner ─── */
  deviceBanner: {
    marginBottom: 18,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
  },
  bannerName: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: COLORS.text,
  },
  bannerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11.5,
    color: COLORS.muted,
    marginTop: 1,
  },

  /* ─── Wi-Fi section ─── */
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  refreshLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: COLORS.green,
  },
  wifiSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
    color: COLORS.muted,
    marginBottom: 14,
  },
  emptyHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: COLORS.text,
  },

  /* ─── Password ─── */
  selectedSsid: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: COLORS.text,
  },
  selectedNetworkLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11.5,
    color: COLORS.muted,
    marginTop: 2,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: COLORS.text,
  },
  eyeBtn: {
    padding: 6,
  },

  /* ─── Status / Links ─── */
  subStatus: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 24,
  },
  ghostLink: {
    marginTop: 20,
  },
  ghostLinkText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: COLORS.green,
  },

  /* ─── Provisioning ─── */
  provisionTitle: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 20,
  },
  provisionList: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    width: "100%",
    marginBottom: 16,
  },
  provisionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  provisionItem: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: COLORS.text,
  },
  provisionItemPending: {
    color: COLORS.muted,
  },

  /* ─── Success / Error ─── */
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  successTitle: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 22,
    color: COLORS.text,
    marginBottom: 4,
  },
  errorCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.critical,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  errorTitle: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 20,
    color: COLORS.critical,
    marginBottom: 4,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
