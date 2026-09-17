import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import COLORS from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const [prefs, setPrefs] = useState({ temp: true, hum: true, gas: true, offline: true, shipment: false });

  async function handleLogout() {
    try {
      await logout();
      navigation.getParent()?.replace("Login");
    } catch (e) {
      Alert.alert(t("profile_logout_failed"), e.message);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top }]}>
        <Text style={styles.title}>{t("profile_title")}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("EditProfile")}
          style={styles.editBtn}
        >
          <Ionicons name="pencil-outline" size={18} color={COLORS.green} />
          <Text style={styles.editText}>{t("profile_edit_profile")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 18 + insets.bottom + 72 },
        ]}
      >
        <View style={styles.head}>
          <LinearGradient colors={[COLORS.green, COLORS.blue]} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(profile?.name || profile?.email)}</Text>
          </LinearGradient>
          <Text style={styles.name}>{profile?.name || profile?.email || t("profile_default_name")}</Text>
          <Text style={styles.muted}>{profile?.role || t("profile_default_role")}</Text>
          <Text style={styles.role}>{profile?.organisation || t("profile_default_org")}</Text>
        </View>

        <Section>
          <Item icon="mail-outline" text={profile?.email || "—"} />
          <Item icon="call-outline" text={profile?.phone || t("profile_no_phone")} />
          <Item icon="business-outline" text={profile?.organisation || t("profile_no_org")} last />
        </Section>

        <Label text={t("profile_notification_settings")} />
        <Section>
          {Object.entries({ temp: t("profile_alert_temp"), hum: t("profile_alert_hum"), gas: t("profile_alert_gas"), offline: t("profile_alert_offline"), shipment: t("profile_alert_shipment") }).map(([k, l], i) => (
            <View key={k} style={[styles.toggle, i === 4 && { borderBottomWidth: 0 }]}>
              <Text style={styles.itemText}>{l}</Text>
              <Switch
                value={prefs[k]}
                onValueChange={() => setPrefs((p) => ({ ...p, [k]: !p[k] }))}
                trackColor={{ false: COLORS.border, true: COLORS.emerald }}
                thumbColor={COLORS.white}
              />
            </View>
          ))}
        </Section>

        <Label text={t("profile_language_settings")} />
        <Section>
          <View style={[styles.toggle, { borderBottomWidth: 0 }]}>
            <Text style={styles.itemText}>{t("profile_language_english")}</Text>
            <Switch
              value={language === "hi"}
              onValueChange={(val) => changeLanguage(val ? "hi" : "en")}
              trackColor={{ false: COLORS.border, true: COLORS.emerald }}
              thumbColor={COLORS.white}
            />
            <Text style={[styles.itemText, { marginLeft: 12 }]}>{t("profile_language_hindi")}</Text>
          </View>
        </Section>

        <Label text={t("profile_account_actions")} />
        <Section>
          <TouchableOpacity
            style={[styles.actionItem, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate("ChangePassword")}
          >
            <Ionicons name="lock-closed-outline" size={19} color={COLORS.green} />
            <Text style={styles.itemText}>{t("profile_change_password")}</Text>
            <Ionicons name="chevron-forward" size={17} color={COLORS.muted} />
          </TouchableOpacity>
        </Section>

        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.critical} />
          <Text style={styles.logoutText}>{t("profile_logout")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const initials = (s) => (s || "AT").split(/[\s@]/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("");

function Label({ text }) {
  return <Text style={styles.label}>{text}</Text>;
}

function Section({ children }) {
  return <View style={styles.section}>{children}</View>;
}

function Item({ icon, text, last }) {
  return (
    <View style={[styles.item, last && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={19} color={COLORS.green} />
      <Text style={styles.itemText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  top: { height: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontFamily: "Manrope_800ExtraBold", fontSize: 16, color: COLORS.text },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
 editText: { fontFamily: "Inter_700Bold", fontSize: 12.5, color: COLORS.green },
  content: { padding: 18, paddingBottom: 105 },
  head: { alignItems: "center", paddingVertical: 14, marginBottom: 8 },
  avatar: { width: 74, height: 74, borderRadius: 37, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  avatarText: { fontFamily: "Manrope_800ExtraBold", fontSize: 24, color: COLORS.white },
  name: { fontFamily: "Manrope_800ExtraBold", fontSize: 17, color: COLORS.text },
  muted: { fontFamily: "Inter_400Regular", fontSize: 12.5, color: COLORS.muted, marginTop: 2 },
  role: { fontFamily: "Inter_700Bold", fontSize: 11, color: COLORS.forest, backgroundColor: COLORS.greenLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginTop: 7 },
  section: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, overflow: "hidden", marginBottom: 18 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  itemText: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.text },
  toggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  actionItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  label: { fontFamily: "Manrope_800ExtraBold", fontSize: 13.5, color: COLORS.text, marginBottom: 10 },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.criticalLight, borderRadius: 12, paddingVertical: 14 },
  logoutText: { fontFamily: "Inter_700Bold", fontSize: 13, color: COLORS.critical },
});