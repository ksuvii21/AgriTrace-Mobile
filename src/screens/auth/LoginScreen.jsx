import React, {
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import COLORS from "../../constants/colors";
import Button from "../../components/common/Button";

export default function LoginScreen({
  navigation,
}) {
  const [email, setEmail] =
    useState("demo@agritrace.in");

  const [password, setPassword] =
    useState("123456");

  const [remember, setRemember] =
    useState(true);

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const login = () => {
    if (!email || !password) {
      Alert.alert(
        "Missing information",
        "Please enter your email and password."
      );

      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (
        email.trim() ===
          "demo@agritrace.in" &&
        password === "123456"
      ) {
        navigation.replace(
          "MainTabs"
        );
      } else {
        Alert.alert(
          "Login Failed",
          "Invalid email or password."
        );
      }
    }, 600);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scroll
        }
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[
            COLORS.green,
            COLORS.emerald,
          ]}
          style={styles.logo}
        >
          <Ionicons
            name="leaf"
            size={28}
            color={COLORS.white}
          />
        </LinearGradient>

        <Text style={styles.title}>
          Welcome Back
        </Text>

        <Text
          style={styles.subtitle}
        >
          Sign in to continue tracking
          your shipments.
        </Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>
              Email
            </Text>

            <View
              style={
                styles.inputContainer
              }
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={COLORS.muted}
              />

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="demo@agritrace.in"
                placeholderTextColor={
                  COLORS.muted
                }
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Password
            </Text>

            <View
              style={
                styles.inputContainer
              }
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={COLORS.muted}
              />

              <TextInput
                value={password}
                onChangeText={
                  setPassword
                }
                placeholder="••••••••"
                placeholderTextColor={
                  COLORS.muted
                }
                secureTextEntry={
                  !showPassword
                }
                style={styles.input}
              />

              <TouchableOpacity
                onPress={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >
                <Ionicons
                  name={
                    showPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={19}
                  color={
                    COLORS.muted
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={styles.options}
          >
            <TouchableOpacity
              style={
                styles.rememberRow
              }
              onPress={() =>
                setRemember(
                  !remember
                )
              }
            >
              <View
                style={[
                  styles.checkbox,

                  remember &&
                    styles.checkboxActive,
                ]}
              >
                {remember && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={
                      COLORS.white
                    }
                  />
                )}
              </View>

              <Text
                style={
                  styles.optionText
                }
              >
                Remember Me
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Password Reset",
                  "Password reset will be connected to Firebase authentication."
                )
              }
            >
              <Text
                style={
                  styles.forgot
                }
              >
                Forgot Password
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Login"
            onPress={login}
            loading={loading}
          />
        </View>

        <View
          style={styles.registerRow}
        >
          <Text
            style={styles.optionText}
          >
            Don't have an account?{" "}
          </Text>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                "Register"
              )
            }
          >
            <Text
              style={styles.register}
            >
              Register
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    root: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    scroll: {
      flexGrow: 1,

      justifyContent: "center",
      alignItems: "center",

      paddingHorizontal: 26,
      paddingVertical: 40,
    },

    logo: {
      width: 58,
      height: 58,

      borderRadius: 18,

      alignItems: "center",
      justifyContent: "center",

      marginBottom: 16,
    },

    title: {
      fontFamily:
        "Manrope_800ExtraBold",

      fontSize: 24,

      color: COLORS.text,

      marginBottom: 7,
    },

    subtitle: {
      fontFamily:
        "Inter_400Regular",

      fontSize: 13,

      color: COLORS.muted,

      textAlign: "center",

      marginBottom: 26,
    },

    form: {
      width: "100%",

      gap: 15,
    },

    field: {
      gap: 7,
    },

    label: {
      fontFamily:
        "Inter_700Bold",

      fontSize: 12,

      color: COLORS.muted,
    },

    inputContainer: {
      flexDirection: "row",

      alignItems: "center",

      gap: 10,

      minHeight: 48,

      paddingHorizontal: 14,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 12,

      backgroundColor:
        COLORS.backgroundBlue,
    },

    input: {
      flex: 1,

      fontFamily:
        "Inter_400Regular",

      fontSize: 14,

      color: COLORS.text,
    },

    options: {
      flexDirection: "row",

      justifyContent:
        "space-between",

      alignItems: "center",

      marginTop: -2,

      marginBottom: 3,
    },

    rememberRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 7,
    },

    checkbox: {
      width: 18,
      height: 18,

      borderRadius: 5,

      borderWidth: 1.5,

      borderColor:
        COLORS.border,

      alignItems: "center",
      justifyContent: "center",
    },

    checkboxActive: {
      backgroundColor:
        COLORS.green,

      borderColor:
        COLORS.green,
    },

    optionText: {
      fontFamily:
        "Inter_400Regular",

      fontSize: 12.5,

      color: COLORS.muted,
    },

    forgot: {
      fontFamily:
        "Inter_700Bold",

      color: COLORS.blue,

      fontSize: 12.5,
    },

    registerRow: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 22,
    },

    register: {
      fontFamily:
        "Inter_700Bold",

      color: COLORS.blue,

      fontSize: 13,
    },
  });