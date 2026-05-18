"use client";

import { useState } from "react";

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.5" />
      {crossed ? <path d="M4 20 20 4" /> : null}
    </svg>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
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
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        window.location.replace("/");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
      <form onSubmit={handleSubmit} style={{ background: "#1e293b", padding: "32px", borderRadius: "16px", width: "380px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 24px 60px rgba(2, 6, 23, 0.36)" }}>
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <div style={{ fontSize: "28px", marginBottom: "4px", color: "#f8fafc", fontWeight: 800 }}>ZIPLINE</div>
          <div style={{ color: "#94a8b8", fontSize: "13px" }}>Command Center</div>
        </div>
        {error ? (
          <div style={{ background: "#7f1d1d", color: "#fecaca", padding: "12px", borderRadius: "10px", fontSize: "13px", lineHeight: 1.45 }}>
            {error}
          </div>
        ) : null}
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#94a8b8" }}>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            style={{ padding: "12px", borderRadius: "10px", border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: "14px" }}
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
              autoComplete="current-password"
              style={{ padding: "12px", paddingRight: "42px", borderRadius: "10px", border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: "14px", width: "100%", boxSizing: "border-box" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: "4px", display: "flex", alignItems: "center" }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon crossed={showPassword} />
            </button>
          </div>
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "12px", background: "#0f766e", color: "#fff", border: "none", borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, fontSize: "14px", fontWeight: 700 }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <div style={{ marginTop: "4px" }}>
          <div style={{ textAlign: "center", fontSize: "11px", color: "#475569", marginBottom: "6px" }}>Demo Account</div>
          <table style={{ width: "100%", fontSize: "11px", color: "#64748b", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0f172a" }}>
                <th style={{ padding: "4px 6px", textAlign: "left", borderBottom: "1px solid #1e293b" }}>Role</th>
                <th style={{ padding: "4px 6px", textAlign: "left", borderBottom: "1px solid #1e293b" }}>Username</th>
                <th style={{ padding: "4px 6px", textAlign: "left", borderBottom: "1px solid #1e293b" }}>Password</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "3px 6px" }}>SUPERADMIN</td>
                <td style={{ padding: "3px 6px", color: "#94a8b8" }}>superadmin</td>
                <td style={{ padding: "3px 6px", color: "#94a8b8" }}>super123</td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </div>
  );
}
