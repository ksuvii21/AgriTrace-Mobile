import React, { useState } from "react";
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
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";

export default function LoginScreen({
  navigation,
}) {
  const { t } = useLanguage();

  const {
    login,
    resetPassword,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  async function handleLogin() {
    if (
      !email.trim() ||
      !password
    ) {
      Alert.alert(
        t("login_missing_title"),
        t("login_missing_body")
      );

      return;
    }

    try {
      setLoading(true);

      await login(
        email.trim(),
        password
      );

      // IMPORTANT:
      // Your navigator is stack-based,
      // so successful login must replace
      // Login with MainTabs.
      navigation.replace(
        "MainTabs"
      );
    } catch (error) {
      Alert.alert(
        t("login_failed_title"),
        error?.message ||
          t("login_failed_default")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert(
        t("login_enter_email_title"),
        t("login_enter_email_body")
      );

      return;
    }

    try {
      await resetPassword(
        email.trim()
      );

      Alert.alert(
        t("login_reset_sent_title"),
        t("login_reset_sent_body")
      );
    } catch (error) {
      Alert.alert(
        t("login_reset_failed_title"),
        error?.message ||
          t("login_reset_failed_default")
      );
    }
  }

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
          {t("login_welcome_back")}
        </Text>

        <Text
          style={styles.subtitle}
        >
          {t("login_subtitle")}
        </Text>

        <View style={styles.form}>
          <Field
            label={t("login_field_email")}
            icon="mail-outline"
          >
            <TextInput
              value={email}
              onChangeText={
                setEmail
              }
              placeholder="you@example.com"
              placeholderTextColor={
                COLORS.muted
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </Field>

          <Field
            label={t("login_field_password")}
            icon="lock-closed-outline"
          >
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
                  (value) =>
                    !value
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
          </Field>

          <TouchableOpacity
            style={{
              alignSelf:
                "flex-end",
            }}
            onPress={handleReset}
          >
            <Text
              style={styles.link}
            >
              {t("login_forgot_password")}
            </Text>
          </TouchableOpacity>

          <Button
            title={t("login_button")}
            onPress={handleLogin}
            loading={loading}
          />
        </View>

        <View
          style={
            styles.registerRow
          }
        >
          <Text
            style={styles.muted}
          >
            {t("login_no_account")}
          </Text>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                "Register"
              )
            }
          >
            <Text
              style={styles.link}
            >
              {t("login_register_link")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  icon,
  children,
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>
        {label}
      </Text>

      <View
        style={styles.inputBox}
      >
        <Ionicons
          name={icon}
          size={18}
          color={COLORS.muted}
        />

        {children}
      </View>
    </View>
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
      justifyContent:
        "center",
      alignItems: "center",
      paddingHorizontal: 26,
      paddingVertical: 40,
    },

    logo: {
      width: 58,
      height: 58,
      borderRadius: 18,
      alignItems: "center",
      justifyContent:
        "center",
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

    label: {
      fontFamily:
        "Inter_700Bold",
      fontSize: 12,
      color: COLORS.muted,
    },

    inputBox: {
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

    link: {
      fontFamily:
        "Inter_700Bold",
      fontSize: 12.5,
      color: COLORS.blue,
    },

    muted: {
      fontFamily:
        "Inter_400Regular",
      fontSize: 12.5,
      color: COLORS.muted,
    },

    registerRow: {
      flexDirection: "row",
      marginTop: 22,
    },
  });