"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Store } from "lucide-react";
import { login } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!password) { setError("Please enter your password."); return; }
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      router.push("/dashboard");
    } catch (err) {
      if (process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
        localStorage.setItem("token", "demo-token");
        localStorage.setItem("company", JSON.stringify({ name: "Premium Wholesale Co.", _id: "demo" }));
        localStorage.setItem("user", JSON.stringify({ name: "Admin User", email: email.trim() }));
        router.push("/dashboard");
        return;
      }
      setError(err.message || "Invalid credentials.");
    } finally { setLoading(false); }
  }

  return (
    <div className="relative min-h-screen min-h-[100dvh] flex flex-col lg:flex-row overflow-x-hidden bg-[#f4f0ea]">
      {/* Mobile top visual strip */}
      <div className="lg:hidden relative h-44 sm:h-52 w-full overflow-hidden shrink-0">
        <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-900/55 to-[#f4f0ea]" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-orange-700 shadow-lg">
            <Store size={18} className="text-white" strokeWidth={1.9} />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-white">Wholesaler OS</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-amber-300/90">Premium Platform</p>
          </div>
        </div>
      </div>

      {/* LEFT — desktop cinematic panel */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between overflow-hidden grain min-h-screen">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=90" alt="" className="h-full w-full object-cover a-blur" />
          <div className="absolute inset-0 bg-gradient-to-br from-stone-950/92 via-stone-900/78 to-orange-950/50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(251,146,60,0.15),transparent_55%)]" />
        </div>

        <div className="absolute top-[18%] right-6 xl:right-10 w-[140px] xl:w-[168px] h-[180px] xl:h-[220px] rounded-2xl overflow-hidden shadow-2xl border border-white/20 a-float rotate-3">
          <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&q=85" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <p className="absolute bottom-3 left-3 text-[10px] font-medium text-white/90 tracking-wide">Inventory</p>
        </div>
        <div className="absolute bottom-[22%] left-6 xl:left-8 w-[160px] xl:w-[200px] h-[120px] xl:h-[140px] rounded-2xl overflow-hidden shadow-2xl border border-white/20 a-float-slow -rotate-2" style={{ animationDelay: "1.5s" }}>
          <img src="https://images.unsplash.com/photo-1605745341242-ae8fef6b0f0a?w=500&q=85" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <p className="absolute bottom-3 left-3 text-[10px] font-medium text-white/90 tracking-wide">Logistics</p>
        </div>
        <div className="hidden xl:block absolute top-[42%] left-[12%] w-[120px] h-[120px] rounded-2xl overflow-hidden shadow-xl border border-white/15 a-float opacity-90 rotate-6" style={{ animationDelay: "0.7s" }}>
          <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80" alt="" className="h-full w-full object-cover" />
        </div>

        <div className="relative z-10 p-10 xl:p-16">
          <div className="flex items-center gap-3.5 a-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-orange-700 shadow-xl shadow-orange-950/50">
              <Store size={22} className="text-white" strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-white">Wholesaler OS</p>
              <p className="text-[10px] uppercase tracking-[0.26em] text-amber-300/90 mt-0.5">Premium Platform</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-10 xl:p-16 space-y-6 xl:space-y-8 max-w-xl">
          <h1 className="text-3xl xl:text-[3.35rem] font-semibold tracking-tight text-white leading-[1.1] a-up">
            Thoughtfully designed for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-200 to-amber-300">wholesale excellence</span>
          </h1>
          <p className="text-stone-300/95 text-sm xl:text-[15.5px] leading-relaxed max-w-md a-up d1">
            One platform. Products, stock, orders, ledger — managed with the same care as a finely crafted space.
          </p>
          <div className="flex gap-8 xl:gap-14 pt-1">
            {[
              { v: "248+", l: "Products" },
              { v: "1.2k", l: "Customers" },
              { v: "99.9%", l: "Uptime" },
            ].map((s, i) => (
              <div key={s.l} className={`a-bounce d${i + 3}`}>
                <p className="text-xl xl:text-[1.65rem] font-semibold text-white tracking-tight tabular-nums">{s.v}</p>
                <p className="text-[10px] xl:text-[11px] text-stone-400 mt-1 tracking-wide">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 p-10 xl:p-16 text-[11px] text-stone-500 tracking-wide">© 2025 Wholesaler OS · Crafted with precision</p>
      </div>

      {/* RIGHT — form */}
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 py-8 sm:p-8 md:p-12 relative w-full min-w-0">
        <div className="absolute top-12 right-4 sm:right-12 w-48 sm:w-80 h-48 sm:h-80 bg-orange-200/35 blob a-float-slow hidden sm:block" />
        <div className="absolute bottom-16 left-4 sm:left-6 w-40 sm:w-64 h-40 sm:h-64 bg-amber-100/45 blob a-float hidden sm:block" style={{ animationDelay: "2s" }} />

        <div className="w-full max-w-[400px] relative z-10 a-bounce">
          <div className="mb-7 sm:mb-9 a-up">
            <h2 className="text-xl sm:text-[1.7rem] font-semibold tracking-tight text-stone-900">Welcome back</h2>
            <p className="mt-2 text-sm text-stone-500 leading-relaxed">Sign in to continue to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-600 a-fade shadow-sm">{error}</div>
            )}
            <div className="space-y-2 a-up d1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500">Email address</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-orange-600" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email"
                  className="w-full h-12 sm:h-[52px] rounded-xl border border-[#e2dcd2] bg-white pl-11 pr-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all duration-300 focus:border-orange-400 shadow-sm hover:border-stone-300" />
              </div>
            </div>
            <div className="space-y-2 a-up d2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500">Password</label>
              <div className="relative group">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-orange-600" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                  className="w-full h-12 sm:h-[52px] rounded-xl border border-[#e2dcd2] bg-white pl-11 pr-12 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all duration-300 focus:border-orange-400 shadow-sm hover:border-stone-300" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full h-12 sm:h-[52px] rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-60 a-up d3 touch-manipulation">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign in <ArrowRight size={16} strokeWidth={2} /></>}
            </button>
          </form>

          <p className="mt-7 sm:mt-9 text-center text-sm text-stone-500 a-up d4">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-orange-700 hover:text-orange-800 font-semibold transition-colors">Create one</Link>
          </p>
          <p className="mt-4 sm:mt-5 text-center text-[11px] text-stone-400 tracking-wide pb-[env(safe-area-inset-bottom)]">Demo mode · any email + password works</p>
        </div>
      </div>
    </div>
  );
}
