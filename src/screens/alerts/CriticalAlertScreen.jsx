/**
 * CriticalAlertScreen
 * -------------------
 * Full-screen emergency warning shown when a critical gas event is
 * received. Designed to feel like a system warning screen rather than
 * a normal popup.
 *
 * Behaviour contract:
 *  - The back gesture / hardware back does NOT dismiss or silence it.
 *    Only ACKNOWLEDGE (or View Details) moves the user on.
 *  - Sound + vibration are owned by AlertContext; this screen only
 *    toggles them and reflects their state.
 *  - All visuals freeze once acknowledged.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import COLORS from "../../constants/colors";
import AlertSeverityBadge from "../../components/alerts/AlertSeverityBadge";
import PulsingShield from "../../components/alerts/PulsingShield";
import { ALERT_SEVERITY } from "../../constants/alertThresholds";
import { formatDateTime } from "../../utils/dateUtils";
import { useAlerts } from "../../context/AlertContext";
import { useLanguage } from "../../context/LanguageContext";

export default function CriticalAlertScreen({ navigation, route }) {
  const { t } = useLanguage();
  const {
    activeAlert,
    acknowledgeActiveAlert,
    soundEnabled,
    vibrationEnabled,
    setSoundEnabled,
    setVibrationEnabled,
  } = useAlerts();

  // Alert may arrive via route params (notification deep-link) or context.
  const routeAlert = route?.params?.alert || null;
  const alert = activeAlert || routeAlert;

  const [acknowledging, setAcknowledging] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  // Badge flash animation (subtle, badge only — never the whole screen).
  const badgeFlash = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeFlash, {
          toValue: 0.45,
          duration: 620,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(badgeFlash, {
          toValue: 1,
          duration: 620,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [badgeFlash]);

  // Block back navigation while the alert is unacknowledged.
  useEffect(() => {
    const onHardwareBack = () => true; // consume the event

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBack
    );

    // `beforeRemove` is a screen-level event. When this screen is hosted
    // inside the global Modal overlay we receive the container ref, which
    // does not emit it — so guard the subscription.
    let unsubscribe;
    if (typeof navigation?.addListener === "function") {
      try {
        unsubscribe = navigation.addListener("beforeRemove", (event) => {
          if (!acknowledging && !confirmation) {
            // Swallow swipe-back / programmatic pop attempts.
            event.preventDefault();
          }
        });
      } catch {
        unsubscribe = undefined;
      }
    }

    return () => {
      subscription.remove();
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [navigation, acknowledging, confirmation]);

  if (!alert) return null;

  const acknowledge = async () => {
    if (acknowledging) return;

    setAcknowledging(true);

    // Stop the emergency animation before we navigate away.
    setConfirmation("Alert acknowledged. Continue monitoring the shipment.");

    try {
      const result = await acknowledgeActiveAlert();

      const message = result?.pending
        ? t("critical_alert_ack_offline")
        : t("critical_alert_ack_confirm");

      setConfirmation(message);
    } catch {
      setConfirmation(t("critical_alert_ack_failed"));
    } finally {
      setAcknowledging(false);
    }
  };

  const viewDetails = () => {
    // Details is a modal-free screen; the alert stays active behind it.
    navigation.navigate("AlertDetails", {
      alertId: alert.id,
      alert,
    });
  };

  /**
   * Leave the alert screen once acknowledged. When hosted inside the
   * global Modal overlay the context already cleared `activeAlert` (so
   * the modal unmounts itself) and a `goBack()` would wrongly pop a real
   * screen — so only call it when the container can actually go back.
   */
  const leaveScreen = () => {
    if (typeof navigation?.canGoBack === "function" && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const notifyTeam = () => {
    navigation.navigate("AlertDetails", { alertId: alert.id, alert, notify: true });
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#1A0505", "#2B0707", "#0B0505"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <MaterialCommunityIcons
              name="leaf"
              size={16}
              color="rgba(255,255,255,0.75)"
            />
            <Text style={styles.brand}>AgriTrace · Emergency</Text>
          </View>

          <View style={styles.toggleGroup}>
            <ToggleButton
              icon={soundEnabled ? "volume-high" : "volume-mute"}
              active={soundEnabled}
              onPress={() => setSoundEnabled(!soundEnabled)}
              accessibilityLabel={
                soundEnabled ? t("critical_alert_sound_on") : t("critical_alert_sound_off")
              }
              label={t("critical_alert_sound")}
            />
            <ToggleButton
              icon={vibrationEnabled ? "vibrate" : "phone-portrait-outline"}
              active={vibrationEnabled}
              onPress={() => setVibrationEnabled(!vibrationEnabled)}
              accessibilityLabel={
                vibrationEnabled
                  ? t("critical_alert_vibration_on")
                  : t("critical_alert_vibration_off")
              }
              label={t("critical_alert_vibration")}
              animated={vibrationEnabled}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <PulsingShield pulsing={!acknowledging && !confirmation} />

            <Text style={styles.heading}>{t("critical_alert_heading")}</Text>
            <Text style={styles.subheading}>{t("critical_alert_subheading")}</Text>

            <Animated.View style={{ opacity: badgeFlash }}>
              <AlertSeverityBadge severity={ALERT_SEVERITY.CRITICAL} />
            </Animated.View>
          </View>

          <View style={styles.gasCard}>
            <Text style={styles.gasLabel}>{t("critical_alert_gas_level")}</Text>
            <Text style={styles.gasValue}>
              {alert.gasLevel == null ? "—" : String(alert.gasLevel)}
            </Text>
            <Text style={styles.gasUnit}>{t("critical_alert_raw_value")}</Text>
          </View>

          <View style={styles.detailCard}>
            <DetailRow
              icon="hardware-chip-outline"
              label={t("critical_alert_device_id")}
              value={alert.deviceId || "—"}
            />
            <DetailRow
              icon="cube-outline"
              label={t("critical_alert_shipment")}
              value={alert.shipmentName || alert.shipmentId || t("critical_alert_unassigned")}
            />
            <DetailRow
              icon="thermometer-outline"
              label={t("critical_alert_temperature")}
              value={
                alert.temperature == null
                  ? "—"
                  : `${Number(alert.temperature).toFixed(1)}°C`
              }
            />
            <DetailRow
              icon="water-outline"
              label={t("critical_alert_humidity")}
              value={
                alert.humidity == null ? "—" : `${Number(alert.humidity).toFixed(0)}%`
              }
            />
            <DetailRow
              icon="location-outline"
              label={t("critical_alert_location")}
              value={alert.location || t("critical_alert_location_unavailable")}
            />
            <DetailRow
              icon="time-outline"
              label={t("critical_alert_timestamp")}
              value={formatDateTime(alert.occurredAt)}
              last
            />
          </View>

          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={17} color="#FFD8D8" />
            <Text style={styles.warningText}>{t("critical_alert_message")}</Text>
          </View>

          {confirmation ? (
            <View style={styles.confirmBox} accessibilityLiveRegion="polite">
              <Ionicons name="checkmark-circle" size={18} color="#7BE3AF" />
              <Text style={styles.confirmText}>{confirmation}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.ghostButton}
            onPress={viewDetails}
            accessibilityRole="button"
            accessibilityLabel={t("critical_alert_view_details")}
          >
            <Ionicons name="document-text-outline" size={17} color={COLORS.white} />
            <Text style={styles.ghostText}>{t("critical_alert_view_details")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ackButton, acknowledging && styles.ackButtonDisabled]}
            onPress={
              confirmation
                ? leaveScreen
                : acknowledge
            }
            disabled={acknowledging}
            accessibilityRole="button"
            accessibilityLabel={
              confirmation ? t("critical_alert_close") : t("critical_alert_acknowledge")
            }
          >
            <Ionicons
              name={confirmation ? "arrow-back" : "checkmark-circle"}
              size={20}
              color="#5A0A0A"
            />
            <Text style={styles.ackText}>
              {confirmation
                ? t("critical_alert_close")
                : acknowledging
                ? t("critical_alert_acknowledging")
                : t("critical_alert_acknowledge")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={notifyTeam}
            accessibilityRole="button"
            accessibilityLabel={t("critical_alert_notify_team")}
          >
            <Ionicons name="people-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.linkText}>{t("critical_alert_notify_team")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function DetailRow({ icon, label, value, last = false }) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={15} color="rgba(255,255,255,0.6)" />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function ToggleButton({ icon, active, onPress, accessibilityLabel, label, animated }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) {
      scale.stopAnimation();
      scale.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 420,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 420,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [animated, scale]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.toggle, active && styles.toggleActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}: ${accessibilityLabel}`}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={icon}
          size={17}
          color={active ? COLORS.white : "rgba(255,255,255,0.5)"}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1A0505" },
  safe: { flex: 1 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 2,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brand: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.3,
  },
  toggleGroup: { flexDirection: "row", gap: 8 },
  toggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  toggleActive: {
    backgroundColor: "rgba(220,69,69,0.28)",
    borderColor: "rgba(220,69,69,0.6)",
  },

  content: { paddingHorizontal: 20, paddingBottom: 18, paddingTop: 4 },

  hero: { alignItems: "center", marginTop: 6, marginBottom: 18 },
  heading: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 27,
    color: COLORS.white,
    marginTop: 16,
    letterSpacing: 0.6,
    textAlign: "center",
  },
  subheading: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#FF9B9B",
    letterSpacing: 2,
    marginTop: 6,
    marginBottom: 12,
    textAlign: "center",
  },

  gasCard: {
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: "rgba(220,69,69,0.14)",
    borderWidth: 1,
    borderColor: "rgba(220,69,69,0.4)",
    marginBottom: 14,
  },
  gasLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  gasValue: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 52,
    color: COLORS.white,
    lineHeight: 58,
    marginTop: 2,
  },
  gasUnit: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#FF9B9B",
    letterSpacing: 1.6,
  },

  detailCard: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
    gap: 10,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 },
  detailLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
  },
  detailValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 12.5,
    color: COLORS.white,
    flexShrink: 1,
    textAlign: "right",
    maxWidth: "58%",
  },

  warningBox: {
    flexDirection: "row",
    gap: 9,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,155,155,0.28)",
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
    lineHeight: 18.5,
    color: "rgba(255,255,255,0.9)",
  },

  confirmBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "rgba(123,227,175,0.12)",
    borderWidth: 1,
    borderColor: "rgba(123,227,175,0.4)",
  },
  confirmText: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12.5,
    lineHeight: 18,
    color: "#C9F5DE",
  },

  actions: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10, gap: 10 },
  ghostButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  ghostText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: COLORS.white,
  },
  ackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minHeight: 58,
    borderRadius: 15,
    backgroundColor: COLORS.white,
  },
  ackButtonDisabled: { opacity: 0.65 },
  ackText: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 15,
    color: "#5A0A0A",
    letterSpacing: 0.4,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 8,
  },
  linkText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12.5,
    color: "rgba(255,255,255,0.8)",
  },
});