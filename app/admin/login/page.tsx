"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Check your email and password, or confirm a superadmin has set up your account.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError("An error occurred. Please try again.");
    }
  }

  return (
    <main className="flex flex-col md:flex-row min-h-screen w-full overflow-hidden bg-background">
      {/* Left Panel: Brand Experience */}
      <section className="hidden md:flex md:w-1/2 bg-[#6B21A8] text-white flex-col justify-between p-10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-8 h-full">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-white flex items-center justify-center rounded-lg shadow-xl">
              <span className="material-symbols-outlined text-[#6B21A8] text-[32px]">school</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold leading-none">MFMCF FUTA</h2>
              <p className="text-xs opacity-80 uppercase tracking-widest">PRIESTS OF GOD GENERATION</p>
            </div>
          </div>
          <div className="mt-auto max-w-md">
            <h1 className="text-5xl font-extrabold mb-4 leading-tight">Worker&apos;s Appreciation 2026</h1>
            <p className="text-base opacity-90 leading-relaxed border-l-4 border-white pl-4">
              Honoring excellence and commitment within our fellowship.
            </p>
          </div>
          <div className="mt-auto">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
              <span className="material-symbols-outlined">lock_person</span>
              <p>WAP COMMITTEE ACCESS</p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel: Auth Form */}
      <section className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8 md:p-0">
        <div className="w-full max-w-[440px] flex flex-col gap-8">
          <div>
            <h3 className="text-2xl font-semibold text-on-surface">Welcome Back</h3>
            <p className="text-sm text-on-surface-variant">Sign in to manage the 2026 worker records.</p>
          </div>

          {error && (
            <div className="bg-error-container border-l-4 border-error p-4 flex gap-3 items-start">
              <span className="material-symbols-outlined text-error">warning</span>
              <div>
                <p className="text-sm text-on-error-container font-bold">Access denied</p>
                <p className="text-xs text-on-error-container opacity-80">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-xs text-on-surface-variant uppercase tracking-tight">Admin Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">mail</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mfmcf-futa.edu.ng"
                  className="w-full h-12 pl-12 pr-4 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-0 focus:border-secondary transition-all text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-on-surface-variant uppercase tracking-tight">Password</label>
                <a href="#" className="text-xs text-secondary hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-12 pl-12 pr-12 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-0 focus:border-secondary transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-black text-white font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Access Dashboard"}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
