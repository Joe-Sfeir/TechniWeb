import React, { useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, ArrowLeft } from "lucide-react";
import { setAuth } from "../lib/auth";

const API_BASE = "http://localhost:8080";
type Step = "credentials" | "2fa";

export default function Login() {
  const navigate = useNavigate();
  const [step,     setStep]     = useState<Step>("credentials");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [otp,      setOtp]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.message as string) ?? "Invalid credentials");
      if (data.requires_2fa) {
        setStep("2fa");
      } else if (data.token && data.role) {
        setAuth(data.token as string, data.role as string);
        navigate((data.role as string) === "CLIENT" ? "/dashboard" : "/admin", { replace: true });
      } else {
        throw new Error("Unexpected server response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handle2FA(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.message as string) ?? "Invalid code");
      if (data.token && data.role) {
        setAuth(data.token as string, data.role as string);
        navigate((data.role as string) === "CLIENT" ? "/dashboard" : "/admin", { replace: true });
      } else {
        throw new Error("Unexpected server response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  const inputBase: CSSProperties = {
    width: "100%", padding: "11px 14px 11px 38px",
    borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)", color: "#f1f5f9",
    fontSize: 14, outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const focusIn  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "rgba(37,99,235,0.7)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)"; };
  const focusOut = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; };

  return (
    <>
      <style>{`
        .login-page {
          background-color: #0a0d13;
          background-image: radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 22px 22px;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-login { to { transform: rotate(360deg); } }
        .login-page input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      <div
        className="login-page"
        style={{ minHeight: "100svh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}
      >
        <div
          style={{
            width: "100%", maxWidth: 420,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            padding: "40px 36px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 16px rgba(37,99,235,0.4)" }}>
              <Zap size={17} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.06em", color: "#e6edf3", lineHeight: 1 }}>TechniDAQ</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", lineHeight: 1.5 }}>Contractor Portal</div>
            </div>
          </div>

          {step === "credentials" ? (
            <>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#f1f5f9", letterSpacing: "-0.025em", margin: "0 0 6px" }}>
                Welcome back
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 28px", lineHeight: 1.5 }}>
                Sign in to access your project dashboards
              </p>

              <form onSubmit={handleCredentials} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Email</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contractor@company.com" style={inputBase} onFocus={focusIn} onBlur={focusOut} autoComplete="email" />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <Lock size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputBase} onFocus={focusIn} onBlur={focusOut} autoComplete="current-password" />
                  </div>
                </div>

                {error && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                    <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#ef4444" }}>{error}</span>
                  </div>
                )}

                <button
                  type="submit" disabled={loading}
                  style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: loading ? "rgba(37,99,235,0.55)" : "#2563eb", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 20px rgba(37,99,235,0.3)", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = loading ? "rgba(37,99,235,0.55)" : "#2563eb"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {loading ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: "spin-login 1s linear infinite" }}>
                      <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
                    </svg>
                  ) : (<>Sign In <ArrowRight size={14} /></>)}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep("credentials"); setOtp(""); setError(null); }}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0, marginBottom: 20, fontSize: 13 }}
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <ShieldCheck size={20} color="#60a5fa" />
              </div>

              <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "#f1f5f9", letterSpacing: "-0.025em", margin: "0 0 6px" }}>
                Two-Factor Auth
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 28px", lineHeight: 1.5 }}>
                Enter the 6-digit code from your authenticator app
              </p>

              <form onSubmit={handle2FA} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    required
                    autoFocus
                    style={{
                      ...inputBase,
                      padding: "14px",
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 28,
                      letterSpacing: "0.4em",
                      textAlign: "center",
                    }}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  />
                </div>

                {error && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                    <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#ef4444" }}>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: "#2563eb", color: "#fff", border: "none", cursor: (loading || otp.length !== 6) ? "not-allowed" : "pointer", boxShadow: "0 4px 20px rgba(37,99,235,0.3)", transition: "all 0.2s", opacity: (loading || otp.length !== 6) ? 0.5 : 1 }}
                >
                  {loading ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: "spin-login 1s linear infinite" }}>
                      <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
                    </svg>
                  ) : (<><ShieldCheck size={14} /> Verify &amp; Sign In</>)}
                </button>
              </form>
            </>
          )}

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Link
              to="/"
              style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
            >
              ← Back to website
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
