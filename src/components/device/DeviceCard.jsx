import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import COLORS from "../../constants/colors";
import { deviceStatusColor } from "../../utils/statusUtils";
import { useLanguage } from "../../context/LanguageContext";

export default function DeviceCard({ device, onPress }) {
  const color = deviceStatusColor(device.status);
  const { t } = useLanguage();
  return (
    <TouchableOpacity activeOpacity={0.82} style={styles.card} onPress={onPress}>
      <View style={[styles.dot,{backgroundColor:color}]} />
      <View style={{flex:1}}>
        <Text style={styles.id}>{device.id}</Text>
        <Text style={styles.sub}>
          {device.shipment ? `${t("device_shipment_label")} ${device.shipment}` : t("device_unassigned")} · {t("device_battery_label")} {device.battery}%
          {device.status === "Offline" ? ` · ${t("device_last_seen_label")} ${device.lastSeen}` : ""}
        </Text>
      </View>
      <Text style={[styles.status,{color}]}>{device.status}</Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  card:{flexDirection:"row",alignItems:"center",gap:14,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:16,paddingHorizontal:16,paddingVertical:14,marginBottom:12},
  dot:{width:12,height:12,borderRadius:6},
  id:{fontFamily:"Inter_700Bold",fontSize:13.5,color:COLORS.text},
  sub:{fontFamily:"Inter_400Regular",fontSize:11.5,color:COLORS.muted,marginTop:2},
  status:{fontFamily:"Inter_700Bold",fontSize:10.5}
});