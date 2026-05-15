"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "ADMIN" | "ACCOUNTING" | "MANAGER" | "STAFF" | "DRIVER";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
} | null;

type AuthContextType = {
  user: CurrentUser;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/login", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  async function refresh() {
    setLoading(true);
    await fetchUser();
  }

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    setUser(null);
    setLoading(false);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}