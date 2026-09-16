import React, { createContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import {
  getMe,
  loginWithEmail,
  registerWithEmail,
  requestPasswordReset,
  updateMe,
  changePassword,
} from "../api/authApi";
import {
  clearSessionStorage,
  getSavedUserProfile,
  saveUserProfile,
} from "../services/storage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initializing, setInitializing] = useState(true);

useEffect(() => {
  let active = true;

  console.log("[AuthContext] mounted");

  async function restoreProfile() {
    try {
      console.log("[AuthContext] restoring profile");

      const saved = await getSavedUserProfile();

      console.log("[AuthContext] saved profile:", saved);

      if (active && saved) {
        setProfile(saved);
      }
    } catch (error) {
      console.error(
        "[AuthContext] restore profile ERROR:",
        error,
        error?.stack
      );
    }
  }

  restoreProfile();

  let unsubscribe;

  async function registerAuthListener() {
    try {
      console.log("[AuthContext] waiting for Firebase auth state");

      if (typeof auth?.authStateReady === "function") {
        await auth.authStateReady();
      }

      if (!active) return;

      console.log("[AuthContext] registering onAuthStateChanged");

      unsubscribe = onAuthStateChanged(
        auth,

        async (user) => {
        try {
          console.log(
            "[AuthContext] auth changed:",
            user?.uid ?? "logged-out"
          );

          if (!active) return;

          setFirebaseUser(user);

          if (!user) {
            setProfile(null);

            try {
              await clearSessionStorage();
            } catch (storageError) {
              console.error(
                "[AuthContext] clear storage ERROR:",
                storageError
              );
            }

            setInitializing(false);
            return;
          }

          try {
            console.log("[AuthContext] requesting /auth/me");

            const me = await getMe();

            console.log("[AuthContext] /auth/me result:", me);

            const nextProfile = me?.profile || null;

            setProfile(nextProfile);

            try {
              await saveUserProfile(nextProfile);
            } catch (storageError) {
              console.error(
                "[AuthContext] save storage ERROR:",
                storageError
              );
            }
          } catch (error) {
            console.error(
              "[AuthContext] getMe ERROR:",
              error,
              error?.stack
            );
          } finally {
            if (active) {
              setInitializing(false);
            }
          }
        } catch (error) {
          console.error(
            "[AuthContext] auth callback ERROR:",
            error,
            error?.stack
          );

          if (active) {
            setInitializing(false);
          }
        }
        },

        (error) => {
          console.error(
            "[AuthContext] Firebase listener ERROR:",
            error
          );

          if (active) {
            setInitializing(false);
          }
        }
      );
    } catch (error) {
      console.error(
        "[AuthContext] onAuthStateChanged setup ERROR:",
        error,
        error?.stack
      );

      if (active) {
        setInitializing(false);
      }
    }
  }

  registerAuthListener();

  return () => {
    active = false;

    if (typeof unsubscribe === "function") {
      unsubscribe();
    }
  };
}, []);

async function login(email, password) {
  const result =
    await loginWithEmail(email, password);

  setFirebaseUser(result.firebaseUser);

  // onAuthStateChanged will fetch /auth/me
  // and update profile automatically.

  return result.firebaseUser;
}

  async function register(payload) {
    const result = await registerWithEmail(payload);
    const nextProfile = result?.profile || null;
    setFirebaseUser(result.firebaseUser);
    setProfile(nextProfile);
    await saveUserProfile(nextProfile);
    return nextProfile;
  }

  async function logout() {
    await signOut(auth);
  }

  async function updateProfile(updates) {
    const updated = await updateMe(updates);
    setProfile(updated);
    await saveUserProfile(updated);
    return updated;
  }

  async function changeUserPassword({ currentPassword, newPassword }) {
    await changePassword({ currentPassword, newPassword });
  }

  const value = useMemo(() => ({
    firebaseUser,
    profile,
    role: profile?.role || null,
    initializing,
    isAuthenticated: !!firebaseUser && !!profile,
    login,
    register,
    logout,
    updateProfile,
    resetPassword: requestPasswordReset,
    changePassword: changeUserPassword,
  }), [firebaseUser, profile, initializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
