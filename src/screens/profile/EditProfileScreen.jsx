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

export default function EditProfileScreen({ navigation }) {
  const { t } = useLanguage();
  const { profile, updateProfile } = useAuth();

  const [form, setForm] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    organisation: profile?.organisation || "",
    address: profile?.address || "",
  });

  const [loading, setLoading] = useState(false);

  const update = (key, value) =>
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

  function validate() {
    if (!form.name.trim() || !form.email.trim()) {
      return t("profile_missing_body");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      return t("profile_email_invalid");
    }

    return null;
  }

  async function submit() {
    const error = validate();

    if (error) {
      Alert.alert(t("profile_missing_title"), error);
      return;
    }

    try {
      setLoading(true);

      await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        organisation: form.organisation.trim() || undefined,
        address: form.address.trim() || undefined,
      });

      Alert.alert(t("profile_save_success"), t("profile_save_success"), [
        { text: t("profile_cancel"), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const message = error?.message || "";

      if (/email.*already|email.*taken|duplicate/i.test(message)) {
        Alert.alert(t("profile_save_failed"), t("profile_email_taken"));
      } else {
        Alert.alert(t("profile_save_failed"), message || t("profile_save_failed"));
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
        <Text style={styles.topTitle}>{t("profile_edit_title")}</Text>
        <View style={{ width: 21 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>{t("profile_edit_subtitle")}</Text>

        <Input
          label={t("profile_field_name")}
          value={form.name}
          onChangeText={(value) => update("name", value)}
          placeholder={t("profile_field_name_placeholder")}
        />

        <Input
          label={t("profile_field_email")}
          value={form.email}
          onChangeText={(value) => update("email", value)}
          placeholder={t("profile_field_email_placeholder")}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Input
          label={t("profile_field_phone")}
          value={form.phone}
          onChangeText={(value) => update("phone", value)}
          placeholder={t("profile_field_phone_placeholder")}
          keyboardType="phone-pad"
        />

        <Input
          label={t("profile_field_organisation")}
          value={form.organisation}
          onChangeText={(value) => update("organisation", value)}
          placeholder={t("profile_field_organisation_placeholder")}
        />

        <Input
          label={t("profile_field_address")}
          value={form.address}
          onChangeText={(value) => update("address", value)}
          placeholder={t("profile_field_address_placeholder")}
        />

        <Button
          title={t("profile_save")}
          onPress={submit}
          loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Input({ label, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={COLORS.muted}
        style={styles.input}
      />
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

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundBlue,
    paddingHorizontal: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: COLORS.text,
  },
});