/**
 * AlertDetailsScreen
 * ------------------
 * Traceability view for a single alert. Reachable from:
 *  - the critical overlay ("View Details")
 *  - a notification tap
 *  - the Alerts history list
 *
 * Acknowledged alerts stay here permanently with status ACKNOWLEDGED so
 * the record remains auditable.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import COLORS from "../../constants/colors";
import TopBar from "../../components/common/TopBar";
import AlertSeverityBadge from "../../components/alerts/AlertSeverityBadge";
import Loader from "../../components/common/Loader";
import { getAlertById, ALERT_STATUS } from "../../services/alertService";
import { getAlert } from "../../api/alertApi";
import { normalizeAlert } from "../../utils/apiMappers";
import { formatDateTime } from "../../utils/dateUtils";
import { severityMeta } from "../../constants/alertThresholds";
import { useAlerts } from "../../context/AlertContext";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";

export default function AlertDetailsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { role } = useAuth();
  const { acknowledgeById, history, processTelemetry } = useAlerts();

  const alertId = route?.params?.alertId;
  const routeAlert = route?.params?.alert || null;

  const [alert, setAlert] = useState(routeAlert);
  const [loading, setLoading] = useState(!routeAlert);
  const [acknowledging, setAcknowledging] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    // 1. local record first — instant + works offline.
    let local = await getAlertById(alertId);

    // 2. fall back to the backend when we don't have it locally.
    if (!local) {
      try {
        const raw = await getAlert(alertId);
        if (raw) local = normalizeAlert(raw).raw;
      } catch {
        // Offline / not found — handled by the empty state below.
      }
    }

    setAlert(local || routeAlert || null);
    setLoading(false);
  }, [alertId, routeAlert]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the view in sync when the alert is acknowledged elsewhere.
  useEffect(() => {
    if (!alertId || !history?.length) return;
    const fresh = history.find((item) => item.id === alertId);
    if (fresh) setAlert(fresh);
  }, [history, alertId]);

  const isAcknowledged = alert?.status === ALERT_STATUS.ACKNOWLEDGED;
  const isPending = alert?.status === ALERT_STATUS.PENDING_ACKNOWLEDGEMENT;

  const acknowledge = async () => {
    if (acknowledging || !alert) return;

    if (role && role !== "ADMIN" && role !== "Operations Manager") {
      // Backend currently restricts acknowledgement to admins; still
      // record clearly for the user instead of failing silently.
      setFeedback(t("alerts_admin_action_body"));
      return;
    }

    setAcknowledging(true);
    setFeedback(null);

    try {
      const result = await acknowledgeById(alert.id);
      setFeedback(
        result?.pending
          ? t("critical_alert_ack_offline")
          : t("critical_alert_ack_confirm")
      );
      await load();
    } catch (error) {
      setFeedback(`${t("critical_alert_ack_failed")} ${error?.message || ""}`.trim());
    } finally {
      setAcknowledging(false);
    }
  };

  /** Dev-only: re-raise this alert to exercise the emergency flow. */
  const replay = () => {
    if (!__DEV__ || !alert) return;
    processTelemetry({
      deviceId: alert.deviceId,
      gasLevel: alert.gasLevel,
      shipmentId: alert.shipmentId,
      sequence: `replay-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  };

  if (loading) return <Loader text={t("alert_details_loading")} />;

  if (!alert) {
    return (
      <View style={styles.screen}>
        <TopBar title={t("alert_details_title")} navigation={navigation} />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={34} color={COLORS.muted} />
          <Text style={styles.emptyText}>{t("alert_details_not_found")}</Text>
        </View>
      </View>
    );
  }

  const meta = severityMeta(alert.severity);

  return (
    <View style={styles.screen}>
      <TopBar title={t("alert_details_title")} navigation={navigation} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
      >
        <View style={[styles.hero, { borderColor: meta.color }]}>
          <View style={[styles.heroIcon, { backgroundColor: meta.soft }]}>
            <Ionicons name="warning" size={22} color={meta.text} />
          </View>
          <Text style={styles.heroTitle}>
            {alert.title || t("alert_critical_gas_title")}
          </Text>
          <Text style={styles.heroDevice}>{alert.deviceId || "—"}</Text>

          <View style={styles.badgeRow}>
            <AlertSeverityBadge severity={alert.severity} />
            <StatusPill status={alert.status} t={t} />
          </View>
        </View>

        <View style={styles.readingCard}>
          <Text style={styles.readingLabel}>{t("critical_alert_gas_level")}</Text>
          <Text style={styles.readingValue}>
            {alert.gasLevel == null ? "—" : String(alert.gasLevel)}
          </Text>
          <Text style={styles.readingUnit}>{t("critical_alert_raw_value")}</Text>
        </View>

        <View style={styles.detailCard}>
          <InfoRow
            icon="hardware-chip-outline"
            label={t("critical_alert_device_id")}
            value={alert.deviceId || "—"}
          />
          <InfoRow
            icon="cube-outline"
            label={t("critical_alert_shipment")}
            value={
              alert.shipmentName ||
              alert.shipmentId ||
              t("critical_alert_unassigned")
            }
          />
          <InfoRow
            icon="thermometer-outline"
            label={t("critical_alert_temperature")}
            value={
              alert.temperature == null
                ? "—"
                : `${Number(alert.temperature).toFixed(1)}°C`
            }
          />
          <InfoRow
            icon="water-outline"
            label={t("critical_alert_humidity")}
            value={alert.humidity == null ? "—" : `${Number(alert.humidity).toFixed(0)}%`}
          />
          <InfoRow
            icon="location-outline"
            label={t("critical_alert_location")}
            value={alert.location || t("critical_alert_location_unavailable")}
          />
          <InfoRow
            icon="time-outline"
            label={t("critical_alert_timestamp")}
            value={formatDateTime(alert.occurredAt)}
          />
          <InfoRow
            icon="checkmark-done-outline"
            label={t("alert_details_acknowledged_by")}
            value={alert.acknowledgedBy || "—"}
          />
          <InfoRow
            icon="calendar-outline"
            label={t("alert_details_acknowledged_at")}
            value={alert.acknowledgedAt ? formatDateTime(alert.acknowledgedAt) : "—"}
            last
          />
        </View>

        <View style={styles.warningBox}>
          <Ionicons name="information-circle" size={17} color={COLORS.blue} />
          <Text style={styles.warningText}>
            {alert.message || t("critical_alert_message")}
          </Text>
        </View>

        {feedback ? (
          <View style={styles.feedbackBox} accessibilityLiveRegion="polite">
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        ) : null}

        {isPending ? (
          <View style={styles.pendingBox}>
            <Ionicons name="cloud-offline-outline" size={16} color="#A16207" />
            <Text style={styles.pendingText}>
              {t("alert_details_pending_sync")}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {!isAcknowledged ? (
        <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
          <TouchableOpacity
            style={[styles.ackButton, acknowledging && styles.disabled]}
            onPress={acknowledge}
            disabled={acknowledging}
            accessibilityRole="button"
            accessibilityLabel={t("critical_alert_acknowledge")}
          >
            {acknowledging ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={19} color={COLORS.white} />
                <Text style={styles.ackText}>
                  {t("critical_alert_acknowledge")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {__DEV__ ? (
        <TouchableOpacity style={styles.devButton} onPress={replay}>
          <Text style={styles.devText}>DEV · Re-raise alert</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function StatusPill({ status, t }) {
  const acknowledged = status === ALERT_STATUS.ACKNOWLEDGED;
  const pending = status === ALERT_STATUS.PENDING_ACKNOWLEDGEMENT;

  const bg = acknowledged ? COLORS.greenLight : pending ? COLORS.warningLight : COLORS.criticalLight;
  const fg = acknowledged ? COLORS.forest : pending ? "#A16207" : COLORS.critical;
  const label = acknowledged
    ? t("alert_status_acknowledged")
    : pending
    ? t("alert_status_pending")
    : t("alert_status_active");

  return (
    <View style={[styles.statusPill, { backgroundColor: bg }]}>
      <Text style={[styles.statusText, { color: fg }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, last = false }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={15} color={COLORS.muted} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: COLORS.muted,
  },
  content: { padding: 18 },

  hero: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 16,
    color: COLORS.text,
    textAlign: "center",
  },
  heroDevice: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
  },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" },
  statusPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7 },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 9.5, letterSpacing: 0.4 },

  readingCard: {
    alignItems: "center",
    backgroundColor: "#1A0505",
    borderRadius: 18,
    paddingVertical: 18,
    marginBottom: 14,
  },
  readingLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  readingValue: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 44,
    color: COLORS.white,
    lineHeight: 50,
  },
  readingUnit: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#FF9B9B",
    letterSpacing: 1.6,
  },

  detailCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 },
  infoLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: COLORS.muted,
  },
  infoValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 12.5,
    color: COLORS.text,
    flexShrink: 1,
    textAlign: "right",
    maxWidth: "58%",
  },

  warningBox: {
    flexDirection: "row",
    gap: 9,
    padding: 13,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundBlue,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
    lineHeight: 18.5,
    color: COLORS.text,
  },

  feedbackBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.greenLight,
    marginBottom: 12,
  },
  feedbackText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12.5,
    color: COLORS.forest,
  },

  pendingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.warningLight,
  },
  pendingText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#A16207",
  },

  footer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  ackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: COLORS.critical,
  },
  disabled: { opacity: 0.65 },
  ackText: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 14.5,
    color: COLORS.white,
  },

  devButton: {
    position: "absolute",
    right: 14,
    bottom: 84,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  devText: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: "#7BE3AF" },
});