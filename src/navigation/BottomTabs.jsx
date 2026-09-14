import React from "react";

import {
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";

import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import DashboardScreen from "../screens/dashboard/DashboardScreen";
import ShipmentsScreen from "../screens/shipments/ShipmentsScreen";
import ScanShipmentScreen from "../screens/shipments/ScanShipmentScreen";
import AlertsScreen from "../screens/alerts/AlertsScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";

import COLORS from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      initialRouteName="Home"

      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor:
          COLORS.green,

        tabBarInactiveTintColor:
          COLORS.muted,

        tabBarLabelStyle: {
          fontFamily:
            "Inter_600SemiBold",

          fontSize: 10,

          marginTop: 1,
        },

        tabBarStyle: {
          position: "absolute",

          left: 0,
          right: 0,
          bottom: 0,

          height:
            Platform.OS === "ios"
              ? 64 + insets.bottom
              : 72,

          paddingTop: 7,

          paddingBottom:
            Platform.OS === "ios"
              ? Math.max(
                  insets.bottom,
                  8
                )
              : 8,

          backgroundColor:
            COLORS.white,

          borderTopWidth: 1,

          borderTopColor:
            COLORS.border,

          elevation: 14,

          shadowColor:
            COLORS.forest,

          shadowOffset: {
            width: 0,
            height: -4,
          },

          shadowOpacity: 0.08,

          shadowRadius: 12,
        },

        tabBarItemStyle: {
          paddingTop: 2,
        },

        tabBarIcon: ({
          color,
          focused,
        }) => {
          let iconName;

          switch (route.name) {
            case "Home":
              iconName = focused
                ? "home"
                : "home-outline";
              break;

            case "Shipments":
              iconName = focused
                ? "cube"
                : "cube-outline";
              break;

            case "Alerts":
              iconName = focused
                ? "notifications"
                : "notifications-outline";
              break;

            case "Profile":
              iconName = focused
                ? "person-circle"
                : "person-circle-outline";
              break;

            default:
              iconName =
                "ellipse-outline";
          }

          return (
            <Ionicons
              name={iconName}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
      {/* HOME */}
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: t("tab_home"),
        }}
      />

      {/* SHIPMENTS */}
      <Tab.Screen
        name="Shipments"
        component={ShipmentsScreen}
        options={{
          tabBarLabel: t("tab_shipments"),
        }}
      />

      {/* CENTRAL QR SCANNER */}
      <Tab.Screen
        name="Scan"
        component={ScanShipmentScreen}
        options={{
          tabBarLabel: "",

          tabBarIcon: () => (
            <View
              style={
                styles.scanOuter
              }
            >
              <View
                style={
                  styles.scanButton
                }
              >
                <Ionicons
                  name="qr-code"
                  size={27}
                  color={
                    COLORS.white
                  }
                />
              </View>
            </View>
          ),
        }}
      />

      {/* ALERTS */}
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          tabBarLabel: t("tab_alerts"),

          tabBarBadge: 4,

          tabBarBadgeStyle: {
            backgroundColor:
              COLORS.critical,

            color: COLORS.white,

            fontFamily:
              "Inter_700Bold",

            fontSize: 9,

            minWidth: 16,

            height: 16,

            lineHeight: 16,
          },
        }}
      />

      {/* PROFILE */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t("tab_profile"),
        }}
      />
    </Tab.Navigator>
  );
}

const styles =
  StyleSheet.create({
    scanOuter: {
      width: 68,
      height: 68,

      alignItems: "center",
      justifyContent: "center",

      marginTop: -28,

      borderRadius: 34,

      backgroundColor:
        COLORS.white,
    },

    scanButton: {
      width: 58,
      height: 58,

      borderRadius: 29,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        COLORS.green,

      borderWidth: 4,

      borderColor:
        COLORS.white,

      shadowColor:
        COLORS.forest,

      shadowOffset: {
        width: 0,
        height: 7,
      },

      shadowOpacity: 0.25,

      shadowRadius: 10,

      elevation: 10,
    },
  });