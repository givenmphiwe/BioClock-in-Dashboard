import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = { email: string } | null;

type AuthContextType = {
  user: User;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const saved = localStorage.getItem("auth:user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = async (email: string, _password: string) => {
    // TODO: replace with real API call
    const u = { email };
    localStorage.setItem("auth:user", JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("auth:user");
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
