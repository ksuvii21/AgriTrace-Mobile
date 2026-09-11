import React from "react";

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import COLORS from "../../constants/colors";
import Button from "../../components/common/Button";

export default function RegisterScreen({
  navigation,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Create Account
      </Text>

      <Text style={styles.subtitle}>
        Full registration form will be
        implemented with the
        authentication module.
      </Text>

      <Button
        title="Back to Login"
        variant="ghost"
        onPress={() =>
          navigation.goBack()
        }
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      justifyContent: "center",

      paddingHorizontal: 26,

      backgroundColor:
        COLORS.background,
    },

    title: {
      fontFamily:
        "Manrope_800ExtraBold",

      fontSize: 24,

      color: COLORS.text,

      textAlign: "center",
    },

    subtitle: {
      fontFamily:
        "Inter_400Regular",

      fontSize: 13,

      lineHeight: 20,

      color: COLORS.muted,

      textAlign: "center",

      marginTop: 8,
      marginBottom: 25,
    },
  });