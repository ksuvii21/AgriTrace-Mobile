import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import COLORS from "../../constants/colors";
import AlertSeverityBadge from "./AlertSeverityBadge";
import { ALERT_STATUS } from "../../services/alertService";
import { useLanguage } from "../../context/LanguageContext";

export default function AlertCard({ alert, onView, onAcknowledge, onPress }) {
  const { t: translate } = useLanguage();

  const acknowledged =
    alert.status === ALERT_STATUS.ACKNOWLEDGED ||
    alert.status === "ACKNOWLEDGED" ||
    alert.resolved === true;
  const pending = alert.status === ALERT_STATUS.PENDING_ACKNOWLEDGEMENT;

  const severityForBadge = alert.severity === "Device" ? "CAUTION" : alert.severity;

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[styles.card, acknowledged && styles.cardMuted]}
      {...(onPress ? { onPress, activeOpacity: 0.85 } : {})}
    >
      <View style={styles.headerRow}>
        <AlertSeverityBadge severity={severityForBadge} />
        <View
          style={[
            styles.statusPill,
            acknowledged
              ? styles.statusAck
              : pending
              ? styles.statusPending
              : styles.statusActive,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              acknowledged
                ? styles.statusAckText
                : pending
                ? styles.statusPendingText
                : styles.statusActiveText,
            ]}
          >
            {acknowledged
              ? translate("alert_status_acknowledged")
              : pending
              ? translate("alert_status_pending")
              : translate("alert_status_active")}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{alert.title}</Text>
      <Text style={styles.sub}>{alert.shipment}</Text>
      <Text style={styles.detail}>{alert.detail}</Text>
      {alert.gasLevel != null ? (
        <Text style={styles.gas}>
          {translate("critical_alert_gas_level")}: {String(alert.gasLevel)}{" "}
          {translate("critical_alert_raw_value")}
        </Text>
      ) : null}
      <Text style={styles.time}>
        {acknowledged ? translate("alert_resolved_label") + " · " : ""}
        {alert.time}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.ghost} onPress={onView}>
          <Text style={styles.ghostText}>
            {alert.type === "Device"
              ? translate("alert_view_device")
              : translate("alert_view_shipment")}
          </Text>
        </TouchableOpacity>
        {!acknowledged && (
          <TouchableOpacity style={styles.primary} onPress={onAcknowledge}>
            <Text style={styles.primaryText}>
              {translate("alert_acknowledge")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card:{backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:16,marginBottom:12},
  cardMuted:{opacity:.62},
  headerRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:9},
  statusPill:{paddingHorizontal:8,paddingVertical:4,borderRadius:6},
  statusActive:{backgroundColor:COLORS.criticalLight},
  statusActiveText:{color:COLORS.critical},
  statusPending:{backgroundColor:COLORS.warningLight},
  statusPendingText:{color:"#A16207"},
  statusAck:{backgroundColor:COLORS.greenLight},
  statusAckText:{color:COLORS.forest},
  statusText:{fontFamily:"Inter_700Bold",fontSize:9,letterSpacing:0.4},
  title:{fontFamily:"Inter_700Bold",fontSize:13.5,color:COLORS.text},
  sub:{fontFamily:"Inter_400Regular",fontSize:12,color:COLORS.muted,marginTop:2},
  detail:{fontFamily:"Inter_400Regular",fontSize:12,color:COLORS.text,marginTop:5},
  gas:{fontFamily:"Inter_700Bold",fontSize:11.5,color:COLORS.critical,marginTop:6},
  time:{fontFamily:"Inter_400Regular",fontSize:10.5,color:COLORS.muted,marginTop:5,marginBottom:11},
  actions:{flexDirection:"row",gap:8},
  ghost:{flex:1,alignItems:"center",paddingVertical:10,borderRadius:10,borderWidth:1,borderColor:COLORS.border,backgroundColor:COLORS.backgroundBlue},
  ghostText:{fontFamily:"Inter_700Bold",fontSize:11.5,color:COLORS.text},
  primary:{flex:1,alignItems:"center",paddingVertical:10,borderRadius:10,backgroundColor:COLORS.green},
  primaryText:{fontFamily:"Inter_700Bold",fontSize:11.5,color:COLORS.white},
});
