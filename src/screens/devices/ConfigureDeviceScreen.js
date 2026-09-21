import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
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
  CMD_CHAR_UUID,
} from "../../services/bleService";

/* ──────────── Step constants ──────────── */
const STEP = {
  PERMISSIONS: "PERMISSIONS",
  SCANNING_BLE: "SCANNING_BLE",
  CONNECTING_BLE: "CONNECTING_BLE",
  SCANNING_WIFI: "SCANNING_WIFI",
  SELECT_WIFI: "SELECT_WIFI",
  ENTER_PASSWORD: "ENTER_PASSWORD",
  PROVISIONING: "PROVISIONING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
};

/* ──────────── BLE scan timeout (ms) ──────────── */
const BLE_SCAN_TIMEOUT = 15000;
const WIFI_SCAN_TIMEOUT = 12000;

export default function ConfigureDeviceScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  /* If navigated from DeviceDetails for "Change Wi-Fi", the route param
     may contain a deviceName hint – we don't auto-connect but it
     lets us show a smarter heading. */
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
  const [statusMsg, setStatusMsg] = useState("");

  const scanTimer = useRef(null);
  const wifiTimer = useRef(null);
  const monitorSub = useRef(null);
  const isMounted = useRef(true);

  /* ──── Lifecycle cleanup ──── */
  useEffect(() => {
    isMounted.current = true;
    startFlow();
    return () => {
      isMounted.current = false;
      bleService.stopScan();
      clearTimeout(scanTimer.current);
      clearTimeout(wifiTimer.current);
      monitorSub.current?.remove();
      if (device) bleService.disconnectDevice(device.id);
    };
  }, []);

  /* ──── Main flow entry ──── */
  const startFlow = async () => {
    setStep(STEP.PERMISSIONS);
    setFoundDevices([]);
    setDevice(null);
    setNetworks([]);
    setSelectedNetwork(null);
    setPassword("");
    setErrorMsg("");
    setStatusMsg("");
    monitorSub.current?.remove();

    const ok = await bleService.requestPermissions();
    if (!ok) {
      return setError("Bluetooth permissions are required to configure your device. Please enable them in Settings.");
    }

    startBleScan();
  };

  /* ──── BLE scan ──── */
  const startBleScan = () => {
    setStep(STEP.SCANNING_BLE);
    setFoundDevices([]);

    bleService.scanForDevices(
      (dev) => {
        if (!isMounted.current) return;
        setFoundDevices((prev) => {
          if (prev.find((d) => d.id === dev.id)) return prev;
          return [...prev, dev];
        });
      },
      (err) => {
        if (!isMounted.current) return;
        setError(`Scan failed: ${err.message}`);
      }
    );

    /* Auto-stop after timeout */
    scanTimer.current = setTimeout(() => {
      bleService.stopScan();
    }, BLE_SCAN_TIMEOUT);
  };

  /* ──── Select & connect to a device ──── */
  const selectDevice = async (dev) => {
    bleService.stopScan();
    clearTimeout(scanTimer.current);
    setDevice(dev);
    setStep(STEP.CONNECTING_BLE);

    try {
      await bleService.connectToDevice(dev.id);

      /* Monitor the command characteristic for status replies */
      monitorSub.current = bleService.monitorCharacteristic(
        dev.id,
        BLE_SERVICE_UUID,
        CMD_CHAR_UUID,
        handleDeviceMessage,
        (err) => {
          if (!isMounted.current) return;
          console.log("Monitor error:", err.reason || err.message);
        }
      );

      /* Request ESP32 Wi-Fi scan */
      setStep(STEP.SCANNING_WIFI);
      setStatusMsg("Requesting network scan from device…");
      await bleService.sendScanCommand(dev.id);

      /* Fallback: If ESP32 doesn't respond with a list */
      wifiTimer.current = setTimeout(() => {
        if (!isMounted.current) return;
        /* If still on SCANNING_WIFI, allow manual entry */
        setStep((prev) => (prev === STEP.SCANNING_WIFI ? STEP.SELECT_WIFI : prev));
      }, WIFI_SCAN_TIMEOUT);
    } catch (err) {
      if (!isMounted.current) return;
      setError(`Could not connect to ${dev.name}.\n${err.message}`);
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
        /* parsing failed – go to empty list / manual */
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
        setError("Wi-Fi connection failed. Please check the network and try again.");
        break;
      case "INVALID_PASSWORD":
        setError("The Wi-Fi password was rejected. Please re-enter the correct password.");
        break;
      case "NETWORK_NOT_FOUND":
        setError("Network not found. Make sure the Wi-Fi router is powered on and within range.");
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
    const ssid = selectedNetwork?.ssid || manualSsid;
    if (!ssid) return;

    setStep(STEP.PROVISIONING);
    setStatusMsg("Sending credentials to device…");

    try {
      await bleService.sendWiFiCredentials(device.id, ssid, password);
      setStatusMsg("Credentials sent. Waiting for device to connect…");
    } catch (err) {
      if (!isMounted.current) return;
      setError(`Failed to send credentials: ${err.message}`);
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

  /* ──── Error helper ──── */
  const setError = (msg) => {
    setErrorMsg(msg);
    setStep(STEP.ERROR);
  };

  /* ════════════════════════════════════════════════════════════════
     RENDER HELPERS  —  one per step
     ════════════════════════════════════════════════════════════════ */

  const renderScanningBle = () => (
    <View style={styles.centerFlex}>
      {foundDevices.length === 0 ? (
        <Loader text="Searching for AgriTrace devices…" />
      ) : (
        <View style={{ width: "100%" }}>
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
                <Text style={styles.bleDeviceName}>{d.name}</Text>
                <Text style={styles.bleDeviceSub}>Tap to connect</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderConnectingBle = () => (
    <Loader text={`Connecting to ${device?.name || "device"}…`} />
  );

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

  const renderSelectWifi = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Connected device banner */}
      <Card style={styles.deviceBanner}>
        <View style={styles.bannerRow}>
          <View style={styles.bannerDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerName}>{device?.name}</Text>
            <Text style={styles.bannerSub}>Connected via Bluetooth</Text>
          </View>
        </View>
      </Card>

      {/* Network list */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>Nearby Networks</Text>
        <TouchableOpacity onPress={refreshWifi} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={16} color={COLORS.green} />
          <Text style={styles.refreshLabel}>Refresh</Text>
        </TouchableOpacity>
      </View>

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

  const renderProvisioning = () => (
    <View style={styles.centerFlex}>
      <Loader text="Provisioning device…" />
      {statusMsg ? <Text style={styles.subStatus}>{statusMsg}</Text> : null}
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.centerFlex}>
      <View style={styles.successCircle}>
        <Ionicons name="checkmark" size={40} color={COLORS.white} />
      </View>
      <Text style={styles.successTitle}>Device Connected!</Text>
      <Text style={styles.subStatus}>
        {device?.name} is now online and will begin transmitting data to AgriTrace.
      </Text>
      <Button title="Done" onPress={() => navigation.goBack()} style={{ marginTop: 28, width: "100%" }} />
    </View>
  );

  const renderError = () => (
    <View style={styles.centerFlex}>
      <View style={styles.errorCircle}>
        <Ionicons name="close" size={40} color={COLORS.white} />
      </View>
      <Text style={styles.errorTitle}>Something Went Wrong</Text>
      <Text style={styles.subStatus}>{errorMsg}</Text>
      <Button title="Retry" onPress={startFlow} style={{ marginTop: 28, width: "100%" }} />
      <Button
        title="Cancel"
        variant="ghost"
        onPress={() => navigation.goBack()}
        style={{ marginTop: 10, width: "100%" }}
      />
    </View>
  );

  /* ════════════ MAIN RENDER ════════════ */
  const stepContent = {
    [STEP.PERMISSIONS]: () => <Loader text="Checking permissions…" />,
    [STEP.SCANNING_BLE]: renderScanningBle,
    [STEP.CONNECTING_BLE]: renderConnectingBle,
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
    marginBottom: 10,
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
    fontSize: 22,
    color: COLORS.critical,
    marginBottom: 4,
  },
});
