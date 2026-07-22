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
      <section className="w-full md:w-1/2 min-h-screen bg-gradient-to-br from-[#FAF5FF] via-white to-[#F3E8FF] md:bg-white flex flex-col justify-start md:justify-center p-0 md:p-0">

        {/* Top purple branding area for mobile */}
        <div className="md:hidden w-full bg-gradient-to-r from-[#6B21A8] to-[#581C87] text-white py-12 px-8 rounded-b-[2rem] shadow-lg flex items-center justify-center text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white flex items-center justify-center rounded-2xl shadow-xl">
              <img src="/favicon.png" alt="MFMCF Logo" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold leading-tight tracking-wide">MFMCF FUTA</h2>
              <p className="text-[10px] opacity-90 uppercase tracking-widest mt-1 font-semibold">Worker&apos;s Appreciation 2026</p>
            </div>
          </div>
        </div>

        {/* Center container for card on mobile */}
        <div className="flex-grow flex items-center justify-center w-full p-4 md:p-0">
          <div className="w-full max-w-[440px] flex flex-col gap-6 bg-white md:bg-transparent border border-purple-100 md:border-none p-6 md:p-0 rounded-2xl shadow-lg md:shadow-none">
            <div className="w-full">
              {/* Logo visible on desktop views (mobile header already has it) */}
              <div className="hidden md:flex w-24 h-24 bg-[#6B21A8]/5 border border-[#6B21A8]/10 items-center justify-center rounded-3xl mb-4 shadow-sm">
                <img src="/favicon.png" alt="MFMCF Logo" className="w-18 h-18 object-contain" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-on-surface">Welcome Back</h3>
              <p className="text-xs md:text-sm text-on-surface-variant mt-1">SIGN IN</p>
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
                <label className="text-xs text-on-surface-variant uppercase tracking-tight font-semibold">Admin Email</label>
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
                  <label className="text-xs text-on-surface-variant uppercase tracking-tight font-semibold">Password</label>
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
                className="w-full h-14 bg-black text-white font-semibold rounded-full hover:bg-[#6B21A8] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2 disabled:opacity-60 cursor-pointer select-none"
              >
                {loading ? "Signing in..." : "Access Dashboard"}
                <svg width="9" height="18" viewBox="0 0 9 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180 shrink-0">
                  <path d="M8.76392 1.39569L1.84742 8.42319C1.69573 8.57652 1.61064 8.7835 1.61064 8.99919C1.61064 9.21488 1.69573 9.42186 1.84742 9.57519L8.76242 16.6042C8.91403 16.7585 8.99899 16.9661 8.99899 17.1824C8.99899 17.3988 8.91403 17.6064 8.76242 17.7607C8.68835 17.8367 8.59983 17.897 8.50207 17.9383C8.4043 17.9795 8.29927 18.0007 8.19317 18.0007C8.08707 18.0007 7.98204 17.9795 7.88427 17.9383C7.78651 17.897 7.69799 17.8367 7.62392 17.7607L0.70892 10.7347C0.254531 10.2719 -4.76837e-05 9.64926 -4.76837e-05 9.00069C-4.76837e-05 8.35213 0.254531 7.72948 0.70892 7.26669L7.62392 0.240692C7.69801 0.16449 7.78663 0.103916 7.88453 0.0625534C7.98243 0.0211906 8.08764 -0.000120163 8.19392 -0.000120163C8.3002 -0.000120163 8.40541 0.0211906 8.50331 0.0625534C8.60121 0.103916 8.68983 0.16449 8.76392 0.240692C8.91553 0.394976 9.00049 0.602633 9.00049 0.818943C9.00049 1.03525 8.91553 1.24291 8.76392 1.39719" fill="currentColor"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
