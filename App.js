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

import { SafeAreaProvider } from "react-native-safe-area-context";

import AppNavigator from "./src/navigation/AppNavigator";
import {
  AuthProvider,
} from "./src/context/AuthContext";
import {
  LanguageProvider,
} from "./src/context/LanguageContext";
import {
  AlertProvider,
} from "./src/context/AlertContext";
import { navigationRef } from "./src/navigation/navigationRef";
import { useAuth } from "./src/hooks/useAuth";

function Root() {
  // `useAuth` gives the alert engine the user identity used to stamp
  // acknowledgements, and lets it tear down alarms on logout.
  const { firebaseUser } = useAuth();

  return (
    <AlertProvider currentUser={firebaseUser} navigationRef={navigationRef}>
      <StatusBar style="dark" />
      <AppNavigator />
    </AlertProvider>
  );
}

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
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}