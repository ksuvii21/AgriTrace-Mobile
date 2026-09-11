import * as SecureStore from "expo-secure-store";

const KEYS = {
  USER_PROFILE:
    "agritrace_user_profile",
};

export async function saveUserProfile(
  profile
) {
  if (!profile) {
    await SecureStore.deleteItemAsync(
      KEYS.USER_PROFILE
    );

    return;
  }

  await SecureStore.setItemAsync(
    KEYS.USER_PROFILE,
    JSON.stringify(profile)
  );
}

export async function getSavedUserProfile() {
  const raw =
    await SecureStore.getItemAsync(
      KEYS.USER_PROFILE
    );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearSessionStorage() {
  await SecureStore.deleteItemAsync(
    KEYS.USER_PROFILE
  );
}