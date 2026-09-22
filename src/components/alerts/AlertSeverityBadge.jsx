/**
 * AlertSeverityBadge
 * ------------------
 * Reusable severity pill for NORMAL / CAUTION / WARNING / CRITICAL.
 *
 * Accessibility: severity is conveyed by BOTH colour and a text label,
 * so it does not rely on colour alone.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { severityMeta } from "../../constants/alertThresholds";
import { useLanguage } from "../../context/LanguageContext";

export default function AlertSeverityBadge({ severity, compact = false }) {
  const meta = severityMeta(severity);
  const { t } = useLanguage();

  const label = t(`severity_${meta.key.toLowerCase()}`);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.soft, borderColor: meta.color },
        compact && styles.compact,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Ionicons name={meta.icon} size={compact ? 11 : 13} color={meta.text} />
      <Text
        style={[
          styles.text,
          { color: meta.text },
          compact && styles.compactText,
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  compact: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  text: {
    fontFamily: "Inter_700Bold",
    fontSize: 9.5,
    letterSpacing: 0.4,
  },
  compactText: {
    fontSize: 8.5,
  },
});