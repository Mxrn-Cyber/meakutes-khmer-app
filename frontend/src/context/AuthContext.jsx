// Replaces Firebase Auth's onAuthStateChanged/signOut with the backend's
// cookie-based session. Wrap the app in <AuthProvider> once (see App.jsx)
// and read/act on the current user anywhere with useAuth().
import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./useAuth";
import { api } from "../api/client";


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const me = await api.login({ email, password });
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async ({ email, password, firstName, lastName }) => {
    const me = await api.register({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    setUser(me);
    return me;
  }, []);

  const loginWithGoogle = useCallback(async (idToken) => {
    const me = await api.loginWithGoogle(idToken);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const me = await api.updateMe(payload);
    setUser(me);
    return me;
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await api.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
    });
  }, []);

  const uploadAvatar = useCallback(async (file) => {
    const me = await api.uploadAvatar(file);
    setUser(me);
    return me;
  }, []);

  const isAdmin = Boolean(user?.roles?.includes("admin"));
  const isEditor = isAdmin || Boolean(user?.roles?.includes("editor"));

  const value = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    isAdmin,
    isEditor,
    login,
    register,
    loginWithGoogle,
    logout,
    refresh,
    updateProfile,
    changePassword,
    uploadAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
