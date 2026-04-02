import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, ArrowLeft } from "lucide-react";
import { setAuth, getToken, getRole, isTokenValid } from "../lib/auth";
import { API_URL } from "../config";
import { BackgroundGrid } from "../components/BackgroundGrid";

type Step = "credentials" | "2fa";

export default function Login() {
  const navigate = useNavigate();
  const [step,     setStep]     = useState<Step>("credentials");
  const [email,    setEmail]    = useState(() => localStorage.getItem("last_email") ?? "");
  const [password, setPassword] = useState("");
  const [otp,      setOtp]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    const role  = getRole();
    if (token && role && isTokenValid()) {
      navigate(role === "CLIENT" ? "/dashboard" : "/admin", { replace: true });
    }
  }, [navigate]);

  const submittingRef = useRef(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? "Invalid credentials");
      if (data.requires_2fa) {
        localStorage.setItem("last_email", email);
        setStep("2fa");
      } else if (data.token && data.user) {
        const user = data.user as { id: number; email: string; role: string };
        localStorage.setItem("last_email", email);
        setAuth(data.token as string, user.role);
        navigate(user.role === "CLIENT" ? "/dashboard" : "/admin", { replace: true });
      } else {
        throw new Error("Unexpected server response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  async function handle2FA(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try { data = JSON.parse(text); } catch { /* empty */ }
      if (!res.ok) throw new Error((data.error as string) ?? "Invalid code");
      if (data.token && data.user) {
        const user = data.user as { id: number; email: string; role: string };
        localStorage.setItem("last_email", email);
        setAuth(data.token as string, user.role);
        navigate(user.role === "CLIENT" ? "/dashboard" : "/admin", { replace: true });
      } else {
        throw new Error("Unexpected server response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  return (
    <div className="min-h-screen bg-brand-black text-white font-sans selection:bg-brand-blue/30 overflow-hidden relative flex flex-col items-center justify-center p-6">
      <BackgroundGrid />

      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl animate-fade-up">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-brand-blue/10 to-transparent opacity-50 pointer-events-none rounded-3xl"></div>

        {/* Brand */}
        <div className="flex items-center space-x-4 mb-10 relative z-10">
          <div className="w-10 h-10 bg-brand-blue flex items-center justify-center font-black text-lg tracking-tighter shadow-[0_0_20px_rgba(26,95,255,0.4)] rounded-xl">TG</div>
          <div>
            <div className="font-bold tracking-[0.15em] text-sm uppercase">Technicat</div>
            <div className="text-[10px] text-zinc-400 tracking-[0.08em] uppercase">Contractor Portal</div>
          </div>
        </div>

        {step === "credentials" ? (
          <div className="relative z-10">
            <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-400 mb-8">
              Sign in to access your project dashboards
            </p>

            <form onSubmit={handleCredentials} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contractor@company.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-brand-blue transition-colors text-sm"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-brand-blue transition-colors text-sm"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-xs">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white py-4 font-bold tracking-[0.15em] uppercase text-xs hover:bg-blue-600 transition-colors rounded-xl mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="relative z-10">
            <button
              onClick={() => { setStep("credentials"); setOtp(""); setError(null); }}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="w-12 h-12 rounded-full bg-brand-blue/20 flex items-center justify-center mb-6 border border-brand-blue/30">
              <ShieldCheck className="w-6 h-6 text-brand-blue" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">
              Two-Factor Auth
            </h1>
            <p className="text-sm text-zinc-400 mb-8">
              Enter the 6-digit code from your authenticator app
            </p>

            <form onSubmit={handle2FA} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase mb-2">Verification Code</label>
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-brand-blue transition-colors text-2xl tracking-[0.5em] text-center font-mono"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-xs">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white py-4 font-bold tracking-[0.15em] uppercase text-xs hover:bg-blue-600 transition-colors rounded-xl mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Verify &amp; Sign In</>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 text-center relative z-10">
          <Link to="/" className="text-xs text-zinc-500 hover:text-white transition-colors tracking-wide">
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
