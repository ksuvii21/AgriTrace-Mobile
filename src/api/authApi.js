import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../config/firebase";
import apiClient, { unwrapEnvelope } from "./apiClient";

export async function loginWithEmail(email, password) {
  const credential =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  return {
    firebaseUser: credential.user,
  };
}

export async function registerWithEmail({ email, password, role, name, phone, organisation, address }) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await credential.user.getIdToken();

  await apiClient.post("/auth/register", { role });

  const updates = { name, phone, organisation, address };
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
  if (Object.keys(filtered).length) {
    await apiClient.put("/auth/me", filtered);
  }

  const me = await getMe();
  return { firebaseUser: credential.user, ...me };
}

export async function getMe() {
  const response = await apiClient.get("/auth/me");
  return response.data;
}

export async function updateMe(updates) {
  const response = await apiClient.put("/auth/me", updates);
  return unwrapEnvelope(response);
}

export async function requestPasswordReset(email) {
  return sendPasswordResetEmail(auth, email.trim());
}

export async function logout() {
  await signOut(auth);
}
