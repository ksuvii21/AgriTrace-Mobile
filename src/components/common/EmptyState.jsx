import React from "react";

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import COLORS from "../../constants/colors";

export default function EmptyState({
  icon = "leaf-outline",
  title = "Nothing here yet",
  message = "No data is currently available.",
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons
          name={icon}
          size={30}
          color={COLORS.green}
        />
      </View>

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",

    justifyContent: "center",

    paddingVertical: 40,
    paddingHorizontal: 24,
  },

  iconBox: {
    width: 58,
    height: 58,

    borderRadius: 18,

    backgroundColor:
      COLORS.greenLight,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 14,
  },

  title: {
    fontFamily: "Manrope_700Bold",

    fontSize: 16,

    color: COLORS.text,

    marginBottom: 5,
  },

  message: {
    fontFamily: "Inter_400Regular",

    fontSize: 12.5,

    lineHeight: 19,

    textAlign: "center",

    color: COLORS.muted,
  },
});