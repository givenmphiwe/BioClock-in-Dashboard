import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthApi } from "../api/authClient";

type User = {
  userId: string;
  userName: string;
  displayName: string;
  email: string;
  clientId: string;
} | null;1

type AuthContextType = {
  user: User;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    setUser(AuthApi.getUser());
  }, []);

  const login = async (email: string, password: string, remember: boolean) => {
    const res = await AuthApi.login(email, password, remember);
    setUser({
      userId: res.userId,
      userName: res.userName,
      displayName: res.displayName,
      email: res.email,
      clientId: res.clientId,
    });
  };

  const logout = async () => {
    await AuthApi.logout();
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
