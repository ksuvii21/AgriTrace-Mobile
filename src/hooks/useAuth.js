import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined || context === null) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}