import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";

function signalInfo(rssi) {
  if (!rssi) return { icon: "wifi-outline", color: COLORS.muted, label: "Unknown signal" };
  if (rssi > -55) return { icon: "wifi", color: COLORS.success, label: "Strong signal" };
  if (rssi > -70) return { icon: "wifi", color: COLORS.warning, label: "Good signal" };
  return { icon: "wifi-outline", color: COLORS.critical, label: "Weak signal" };
}

export default function WiFiNetworkItem({ network, onPress, selected }) {
  const { ssid, rssi, secure } = network;
  const { icon, color, label } = signalInfo(rssi);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: selected ? COLORS.greenLight : COLORS.backgroundBlue }]}>
        <Ionicons name={icon} size={20} color={selected ? COLORS.green : color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.ssid} numberOfLines={1}>{ssid}</Text>
        <Text style={[styles.meta, { color }]}>{label}</Text>
      </View>
      {secure && (
        <Ionicons name="lock-closed" size={14} color={COLORS.muted} style={{ marginRight: 6 }} />
      )}
      <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenLight,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  ssid: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13.5,
    color: COLORS.text,
  },
  meta: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
});
