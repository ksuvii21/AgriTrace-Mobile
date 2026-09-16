import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import COLORS from "../../constants/colors";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";

export default function ChangePasswordScreen({ navigation }) {
  const { t } = useLanguage();
  const { changePassword } = useAuth();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key, value) =>
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

  async function submit() {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      Alert.alert(t("profile_missing_title"), t("profile_missing_body"));
      return;
    }

    if (form.newPassword.length < 6) {
      Alert.alert(t("profile_password_weak"), t("profile_password_weak"));
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      Alert.alert(t("profile_password_mismatch"), t("profile_password_mismatch"));
      return;
    }

    try {
      setLoading(true);

      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      Alert.alert(t("profile_password_changed"), t("profile_password_changed"), [
        { text: t("profile_cancel"), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const message = error?.message || "";

      if (/wrong-password|invalid-credential|auth\/invalid-credential|reauth/i.test(message)) {
        Alert.alert(t("profile_password_change_failed"), t("profile_current_password_wrong"));
      } else {
        Alert.alert(t("profile_password_change_failed"), message || t("profile_password_change_failed"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.top}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={21} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t("profile_change_password_title")}</Text>
        <View style={{ width: 21 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>{t("profile_change_password_subtitle")}</Text>

        <PasswordInput
          label={t("profile_field_current_password")}
          value={form.currentPassword}
          onChangeText={(value) => update("currentPassword", value)}
          placeholder={t("profile_field_current_password_placeholder")}
          show={showCurrent}
          toggle={() => setShowCurrent((value) => !value)}
        />

        <PasswordInput
          label={t("profile_field_new_password")}
          value={form.newPassword}
          onChangeText={(value) => update("newPassword", value)}
          placeholder={t("profile_field_new_password_placeholder")}
          show={showNew}
          toggle={() => setShowNew((value) => !value)}
        />

        <PasswordInput
          label={t("profile_field_confirm_password")}
          value={form.confirmPassword}
          onChangeText={(value) => update("confirmPassword", value)}
          placeholder={t("profile_field_confirm_password_placeholder")}
          show={showConfirm}
          toggle={() => setShowConfirm((value) => !value)}
        />

        <Button
          title={t("profile_change_password_button")}
          onPress={submit}
          loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PasswordInput({ label, value, onChangeText, placeholder, show, toggle }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputBox}>
        <Ionicons
          name="lock-closed-outline"
          size={18}
          color={COLORS.muted}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.muted}
          secureTextEntry={!show}
          style={styles.input}
        />
        <TouchableOpacity onPress={toggle}>
          <Ionicons
            name={show ? "eye-off-outline" : "eye-outline"}
            size={19}
            color={COLORS.muted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  top: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  topTitle: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 15.5,
    color: COLORS.text,
  },

  content: {
    padding: 22,
  },

  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 18,
  },

  label: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 6,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundBlue,
  },

  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: COLORS.text,
  },
});