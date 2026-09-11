import React from "react";
import {
  View,
  StyleSheet,
} from "react-native";

import COLORS from "../../constants/colors";

export default function Card({
  children,
  style,
}) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,

    borderRadius: 16,

    borderWidth: 1,
    borderColor: COLORS.border,

    padding: 16,

    shadowColor: COLORS.forest,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,

    elevation: 2,
  },
});