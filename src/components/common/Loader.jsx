import React from "react";
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
} from "react-native";

import COLORS from "../../constants/colors";

export default function Loader({
  text = "Loading...",
}) {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color={COLORS.green}
      />

      {text && (
        <Text style={styles.text}>
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    gap: 12,
  },

  text: {
    fontFamily: "Inter_500Medium",

    color: COLORS.muted,

    fontSize: 13,
  },
});