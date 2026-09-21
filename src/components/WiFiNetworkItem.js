import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";

/**
 * Returns a wifi icon name based on RSSI strength.
 */
function getSignalIcon(rssi) {
  if (!rssi) return "wifi";
  if (rssi > -55) return "wifi";
  if (rssi > -70) return "wifi";
  return "wifi-outline";
}

/**
 * Returns a signal color based on RSSI.
 */
function getSignalColor(rssi) {
  if (!rssi) return COLORS.muted;
  if (rssi > -55) return COLORS.success;
  if (rssi > -70) return COLORS.warning;
  return COLORS.critical;
}

export default function WiFiNetworkItem({ network, onPress, selected }) {
  const { ssid, rssi, secure } = network;
  const signalColor = getSignalColor(rssi);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: selected ? COLORS.greenLight : COLORS.backgroundBlue }]}>
        <Ionicons name={getSignalIcon(rssi)} size={20} color={selected ? COLORS.green : signalColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.ssid} numberOfLines={1}>{ssid}</Text>
        {rssi != null && (
          <Text style={styles.meta}>{rssi} dBm · 2.4 GHz</Text>
        )}
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
    color: COLORS.muted,
    marginTop: 2,
  },
});
