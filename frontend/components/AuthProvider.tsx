"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  clearPersistedAuth,
  getAuthToken,
  persistAuth,
  readPersistedUser,
} from "@/lib/auth";
import type { AuthUser } from "@/types/user";

type AuthContextValue = {
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUserState] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      setUserState(readPersistedUser());
    } catch {
      clearPersistedAuth();
      setUserState(null);
    }
  }, []);

  const login = (token: string, nextUser: AuthUser) => {
    persistAuth(token, nextUser);
    setUserState(nextUser);
  };

  const logout = () => {
    clearPersistedAuth();
    setUserState(null);
  };

  const setUser = (nextUser: AuthUser | null) => {
    if (!nextUser) {
      clearPersistedAuth();
      setUserState(null);
      return;
    }

    const token = getAuthToken();
    if (token) {
      persistAuth(token, nextUser);
    } else {
      localStorage.setItem("user", JSON.stringify(nextUser));
    }
    setUserState(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth csak AuthProvider-en belül használható.");
  }
  return ctx;
}
