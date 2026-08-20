import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import api, { tokenStore } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!tokenStore.getAccess()) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get<User>("/auth/me/");
        setUser(res.data);
      } catch {
        tokenStore.clear();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    const res = await api.post("/auth/login/", { username, password });
    tokenStore.setTokens(res.data.access, res.data.refresh);
    const me = await api.get<User>("/auth/me/");
    setUser(me.data);
    return me.data;
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
