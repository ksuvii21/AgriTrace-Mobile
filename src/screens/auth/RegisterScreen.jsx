import React, {
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import COLORS from "../../constants/colors";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";

const roleOptions = [
  "FARMER",
  "TRANSPORTER",
  "WAREHOUSE",
];

export default function RegisterScreen({
  navigation,
}) {
  const { t } = useLanguage();
  const roleLabels = {
    FARMER: t("role_farmer"),
    TRANSPORTER: t("role_transporter"),
    WAREHOUSE: t("role_warehouse"),
  };

  const { register } =
    useAuth();

  const [form, setForm] =
    useState({
      name: "",
      email: "",
      password: "",
      phone: "",
      organisation: "",
      role: "FARMER",
    });

  const [loading, setLoading] =
    useState(false);

  const update = (key, value) =>
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

  async function submit() {
    if (
      !form.email.trim() ||
      !form.password ||
      !form.role
    ) {
      Alert.alert(
        t("register_missing_title"),
        t("register_missing_body")
      );

      return;
    }

    if (
      form.password.length < 6
    ) {
      Alert.alert(
        t("register_invalid_password_title"),
        t("register_invalid_password_body")
      );

      return;
    }

    try {
      setLoading(true);

      await register({
        ...form,
        email:
          form.email.trim(),
      });

      navigation.replace(
        "MainTabs"
      );
    } catch (error) {
      Alert.alert(
        t("register_failed_title"),
        error?.message ||
          t("register_failed_default")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <Text
          style={styles.topTitle}
        >
          {t("register_title")}
        </Text>

        <View
          style={{ width: 21 }}
        />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label={t("register_field_name")}
          value={form.name}
          onChangeText={(value) =>
            update(
              "name",
              value
            )
          }
          placeholder={t("register_field_name_placeholder")}
        />

        <Input
          label={t("register_field_email")}
          value={form.email}
          onChangeText={(value) =>
            update(
              "email",
              value
            )
          }
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label={t("register_field_password")}
          value={form.password}
          onChangeText={(value) =>
            update(
              "password",
              value
            )
          }
          placeholder={t("register_field_password_placeholder")}
          secureTextEntry
        />

        <Input
          label={t("register_field_org")}
          value={
            form.organisation
          }
          onChangeText={(value) =>
            update(
              "organisation",
              value
            )
          }
          placeholder={t("register_field_org_placeholder")}
        />

        <Input
          label={t("register_field_phone")}
          value={form.phone}
          onChangeText={(value) =>
            update(
              "phone",
              value
            )
          }
          placeholder="+91..."
          keyboardType="phone-pad"
        />

        <Text
          style={styles.label}
        >
          {t("register_field_role")}
        </Text>

        <View
          style={styles.roles}
        >
          {roleOptions.map(
            (role) => (
              <TouchableOpacity
                key={role}
                onPress={() =>
                  update(
                    "role",
                    role
                  )
                }
                style={[
                  styles.roleBtn,
                  form.role ===
                    role &&
                    styles.roleActive,
                ]}
              >
                <Text
                  style={[
                    styles.roleText,
                    form.role ===
                      role && {
                      color:
                        COLORS.white,
                    },
                  ]}
                >
                  {roleLabels[role]}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <Button
          title={t("register_button")}
          onPress={submit}
          loading={loading}
        />

        <Text style={styles.note}>
          {t("register_note")}
        </Text>
      </ScrollView>
    </View>
  );
}

function Input({
  label,
  ...props
}) {
  return (
    <View
      style={{
        marginBottom: 14,
      }}
    >
      <Text
        style={styles.label}
      >
        {label}
      </Text>

      <TextInput
        {...props}
        placeholderTextColor={
          COLORS.muted
        }
        style={styles.input}
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    top: {
      height: 58,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 18,
      backgroundColor:
        COLORS.white,
      borderBottomWidth: 1,
      borderBottomColor:
        COLORS.border,
    },

    topTitle: {
      fontFamily:
        "Manrope_800ExtraBold",
      fontSize: 15.5,
      color: COLORS.text,
    },

    content: {
      padding: 22,
    },

    label: {
      fontFamily:
        "Inter_700Bold",
      fontSize: 12,
      color: COLORS.muted,
      marginBottom: 6,
    },

    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius: 12,
      backgroundColor:
        COLORS.backgroundBlue,
      paddingHorizontal: 14,
      fontFamily:
        "Inter_400Regular",
      fontSize: 14,
      color: COLORS.text,
    },

    roles: {
      flexDirection: "row",
      gap: 7,
      marginBottom: 18,
    },

    roleBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      backgroundColor:
        COLORS.white,
    },

    roleActive: {
      backgroundColor:
        COLORS.green,
      borderColor:
        COLORS.green,
    },

    roleText: {
      fontFamily:
        "Inter_700Bold",
      fontSize: 10.5,
      color: COLORS.text,
    },

    note: {
      fontFamily:
        "Inter_400Regular",
      fontSize: 10.5,
      color: COLORS.muted,
      lineHeight: 16,
      textAlign: "center",
      marginTop: 12,
    },
  });