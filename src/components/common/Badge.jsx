import React from "react";

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import COLORS from "../../constants/colors";

export default function Badge({
  text,
  type = "success",
}) {
  const theme =
    themes[type] || themes.success;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            theme.background,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: theme.color,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const themes = {
  success: {
    background: COLORS.greenLight,
    color: COLORS.forest,
  },

  transit: {
    background: COLORS.blueLight,
    color: COLORS.blue,
  },

  warning: {
    background: COLORS.warningLight,
    color: "#A16207",
  },

  critical: {
    background: COLORS.criticalLight,
    color: COLORS.critical,
  },

  neutral: {
    background: COLORS.backgroundBlue,
    color: COLORS.muted,
  },
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",

    paddingHorizontal: 10,
    paddingVertical: 5,

    borderRadius: 100,
  },

  text: {
    fontFamily: "Inter_700Bold",

    fontSize: 10,

    letterSpacing: 0.2,
  },
});