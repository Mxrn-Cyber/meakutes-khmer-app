import { createContext, useContext } from "react";

// The logged-in user and auth actions. Needs <AuthProvider> (AuthContext.jsx).
export const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
