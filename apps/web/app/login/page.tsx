"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        window.location.replace("/");
      } else {
        const data = await res.json();
        setError(data.error ?? "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
      <form onSubmit={handleSubmit} style={{ background: "#1e293b", padding: "32px", borderRadius: "12px", width: "360px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <div style={{ fontSize: "28px", marginBottom: "4px" }}>ZIPLINE</div>
          <div style={{ color: "#94a8b8", fontSize: "13px" }}>Command Center</div>
        </div>
        {error ? (
          <div style={{ background: "#7f1d1d", color: "#fca5a5", padding: "10px", borderRadius: "6px", fontSize: "13px" }}>
            {error}
          </div>
        ) : null}
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#94a8b8" }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: "14px" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#94a8b8" }}>
          Password
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: "10px", paddingRight: "40px", borderRadius: "6px", border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: "14px", width: "100%", boxSizing: "border-box" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "16px", padding: "4px", display: "flex", alignItems: "center" }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "12px", background: "#0f766e", color: "#fff", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, fontSize: "14px", fontWeight: 600 }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <div style={{ marginTop: "4px" }}>
          <div style={{ textAlign: "center", fontSize: "11px", color: "#475569", marginBottom: "6px" }}>Dev Accounts</div>
          <table style={{ width: "100%", fontSize: "11px", color: "#64748b", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0f172a" }}>
                <th style={{ padding: "4px 6px", textAlign: "left", borderBottom: "1px solid #1e293b" }}>Role</th>
                <th style={{ padding: "4px 6px", textAlign: "left", borderBottom: "1px solid #1e293b" }}>Email</th>
                <th style={{ padding: "4px 6px", textAlign: "left", borderBottom: "1px solid #1e293b" }}>Password</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "3px 6px" }}>MANAGER</td>
                <td style={{ padding: "3px 6px", color: "#94a8b8" }}>officer@zipline.com</td>
                <td style={{ padding: "3px 6px", color: "#94a8b8" }}>zipline123</td>
              </tr>
              <tr style={{ background: "#0f172a" }}>
                <td style={{ padding: "3px 6px" }}>ADMIN</td>
                <td style={{ padding: "3px 6px", color: "#94a8b8" }}>owner@zipline.com</td>
                <td style={{ padding: "3px 6px", color: "#94a8b8" }}>owner123</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 6px" }}>ACCOUNTING</td>
                <td style={{ padding: "3px 6px", color: "#94a8b8" }}>accounting@zipline.com</td>
                <td style={{ padding: "3px 6px", color: "#94a8b8" }}>accounting123</td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </div>
  );
}
