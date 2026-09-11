import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import COLORS from "../../constants/colors";

export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  if (variant === "primary") {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.wrapper,
          disabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={[
            COLORS.green,
            COLORS.emerald,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primary}
        >
          {loading ? (
            <ActivityIndicator
              color={COLORS.white}
              size="small"
            />
          ) : (
            <Text
              style={[
                styles.primaryText,
                textStyle,
              ]}
            >
              {title}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        variant === "ghost" && styles.ghost,
        variant === "danger" && styles.danger,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={COLORS.green}
        />
      ) : (
        <Text
          style={[
            styles.text,
            variant === "ghost" &&
              styles.ghostText,

            variant === "danger" &&
              styles.dangerText,

            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },

  primary: {
    minHeight: 50,

    borderRadius: 12,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 18,
  },

  primaryText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: COLORS.white,
  },

  base: {
    width: "100%",

    minHeight: 48,

    borderRadius: 12,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 18,
  },

  ghost: {
    backgroundColor: COLORS.backgroundBlue,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  danger: {
    backgroundColor: COLORS.criticalLight,
  },

  text: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },

  ghostText: {
    color: COLORS.text,
  },

  dangerText: {
    color: COLORS.critical,
  },

  disabled: {
    opacity: 0.55,
  },
});