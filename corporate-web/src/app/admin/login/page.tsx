"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff 
} from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al autenticar");
        setLoading(false);
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError("Error de conexión con el servidor");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#01426F] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(176,138,26,0.22),transparent)] pointer-events-none" />

      <div className="max-w-lg w-full relative z-10">
        {/* Enlace Volver */}
        <div className="mb-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-[#D4AF37] transition-colors uppercase tracking-wider"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>Volver al Portal Corporativo</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200/90">
          {/* Brand Header con Logo Oficial NeoGestión en Gran Formato (2x) con Animación Corporativa */}
          <div className="text-center mb-8">
            <Link href="/" className="relative inline-block focus:outline-none mb-4 group">
              {/* Halo de Luz y Aura Corporativa en Segundo Plano */}
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/25 via-[#01426F]/20 to-[#D4AF37]/30 blur-2xl rounded-3xl animate-corporate-aura pointer-events-none" />

              {/* Contenedor Flotante del Logo */}
              <div className="relative animate-corporate-float overflow-hidden p-2 rounded-2xl">
                <Image
                  src="/brand/logo-neogestion-login.png"
                  alt="NeoGestión Software"
                  width={560}
                  height={214}
                  className="w-auto h-28 sm:h-32 md:h-36 max-w-[340px] sm:max-w-[420px] mx-auto object-contain transition-transform duration-500 ease-out group-hover:scale-[1.04] drop-shadow-sm"
                  priority
                />

                {/* Destello / Barrido de Luz Ejecutivo Transversal */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                  <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-corporate-sweep" />
                </div>
              </div>
            </Link>

            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="h-px w-6 bg-[#B08A1A]/40" />
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500 font-sans">
                Panel de Administración &amp; Analítica
              </p>
              <span className="h-px w-6 bg-[#B08A1A]/40" />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form 
            onSubmit={handleLogin} 
            className="space-y-4"
            action="/api/admin/auth"
            method="POST"
          >
            <div>
              <label 
                htmlFor="admin-username" 
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  id="admin-username"
                  name="username"
                  type="email"
                  required
                  autoComplete="username"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#B08A1A] transition-all"
                  placeholder="ejemplo@empresa.com"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="admin-password" 
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#B08A1A] transition-all"
                  placeholder="Ingrese su contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#01426F] hover:bg-slate-900 text-[#D4AF37] font-bold text-sm transition-all shadow-md border border-[#B08A1A]/40 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Acceso Seguro y Cifrado SSL / TLS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
