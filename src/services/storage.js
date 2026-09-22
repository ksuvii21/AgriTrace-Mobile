import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  USER_PROFILE: "agritrace_user_profile",
  ONBOARDING_COMPLETED: "agritrace_onboarding_completed",
  ALERT_HISTORY: "agritrace_alert_history",
  PENDING_ACKS: "agritrace_pending_acknowledgements",
};

export { KEYS as STORAGE_KEYS };

export async function saveUserProfile(profile) {
  if (!profile) {
    await SecureStore.deleteItemAsync(KEYS.USER_PROFILE);
    return;
  }
  await SecureStore.setItemAsync(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function getSavedUserProfile() {
  const raw = await SecureStore.getItemAsync(KEYS.USER_PROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearSessionStorage() {
  await SecureStore.deleteItemAsync(KEYS.USER_PROFILE);
}

export async function setOnboardingCompleted() {
  await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETED, "true");
}

export async function getOnboardingCompleted() {
  const value = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETED);
  return value === "true";
}