import React from "react";

import {
  StatusBar,
} from "expo-status-bar";

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

import AppNavigator from "./src/navigation/AppNavigator";

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
    <>
      <StatusBar style="dark" />

      <AppNavigator />
    </>
  );
}