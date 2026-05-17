"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import type { BoardKey } from "./role-guards";

export type UserRole = "SUPERADMIN" | "ADMIN" | "ACCOUNTING" | "MANAGER" | "STAFF" | "DRIVER";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  moduleAccess?: BoardKey[];
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
  const abortRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);

  async function fetchUser(options?: { showLoading?: boolean }) {
    const showLoading = options?.showLoading ?? true;
    const requestSeq = ++requestSeqRef.current;

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    if (showLoading) {
      setLoading(true);
    }
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch("/api/auth/login", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal
      });

      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      setUser(null);
    } finally {
      clearTimeout(timeoutId);
      if (requestSeq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchUser({ showLoading: true });

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        fetchUser({ showLoading: true });
      } else {
        fetchUser({ showLoading: false });
      }
    }

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  async function refresh() {
    await fetchUser({ showLoading: true });
  }

  async function logout() {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    await fetch("/api/auth/login", { method: "DELETE" });
    setUser(null);
    setLoading(false);
    window.location.replace("/login");
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
