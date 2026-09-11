import React from "react";

import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import {
  useFonts as useManrope,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";

import {
  StatusBar,
} from "expo-status-bar";

import AppNavigator from "./src/navigation/AppNavigator";
import {
  AuthProvider,
} from "./src/context/AuthContext";

export default function App() {
  const [interLoaded] =
    useInter({
      Inter_400Regular,
      Inter_500Medium,
      Inter_600SemiBold,
      Inter_700Bold,
    });

  const [manropeLoaded] =
    useManrope({
      Manrope_600SemiBold,
      Manrope_700Bold,
      Manrope_800ExtraBold,
    });

  if (
    !interLoaded ||
    !manropeLoaded
  ) {
    return null;
  }

  return (
    <AuthProvider>
      <StatusBar
        style="dark"
      />

      <AppNavigator />
    </AuthProvider>
  );
}