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

const roleOptions = [
  "FARMER",
  "TRANSPORTER",
  "WAREHOUSE",
];

export default function RegisterScreen({
  navigation,
}) {
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
        "Missing information",
        "Email, password and role are required."
      );

      return;
    }

    if (
      form.password.length < 6
    ) {
      Alert.alert(
        "Invalid password",
        "Password must contain at least 6 characters."
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
        "Registration failed",
        error?.message ||
          "Unable to create account."
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
          Create Account
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
          label="Full Name"
          value={form.name}
          onChangeText={(value) =>
            update(
              "name",
              value
            )
          }
          placeholder="Your name"
        />

        <Input
          label="Email"
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
          label="Password"
          value={form.password}
          onChangeText={(value) =>
            update(
              "password",
              value
            )
          }
          placeholder="Minimum 6 characters"
          secureTextEntry
        />

        <Input
          label="Organisation"
          value={
            form.organisation
          }
          onChangeText={(value) =>
            update(
              "organisation",
              value
            )
          }
          placeholder="ABC Organic Farm"
        />

        <Input
          label="Phone"
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
          Role
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
                  {role}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <Button
          title="Create Account"
          onPress={submit}
          loading={loading}
        />

        <Text style={styles.note}>
          Choose the role that
          matches your part of
          the farm-to-fork supply
          chain.
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