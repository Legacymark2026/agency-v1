"use client";

import { useState, useEffect } from "react";
import { registerAgency } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Loader2, Building, User, Mail, Lock, Briefcase, Globe, Users, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getClientDeviceSignals, computeClientDeviceHash } from "@/lib/client-fingerprint";

export function RegisterAgencyForm() {
  const [loading, setLoading] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const signals = getClientDeviceSignals();
      computeClientDeviceHash(signals).then((hash) => {
        if (hash) {
          setDeviceFingerprint(hash);
        }
      });
    } catch {
      // Degradar pacíficamente
    }
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (deviceFingerprint) {
        formData.set("deviceFingerprint", deviceFingerprint);
      }
      const res = await registerAgency(formData);

      if (!res.success) {
        const errorMsg = (res as any).error || (res as any).message || "Error al crear la agencia.";
        toast.error(errorMsg);
      } else {
        toast.success("¡Agencia creada con éxito! Bienvenido a LegacyMark.");
        router.push(res.data.redirectTo);
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "block w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors text-xs";
  const selectClass = "block w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors cursor-pointer";
  const labelClass = "block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={onSubmit} className="space-y-4 w-full">
      <input type="hidden" name="deviceFingerprint" value={deviceFingerprint} />

      {/* Nombre de la Empresa */}
      <div>
        <label htmlFor="agencyName" className={labelClass}>
          Nombre de la Empresa / Negocio
        </label>
        <div className="relative">
          <Building className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            id="agencyName"
            name="agencyName"
            placeholder="Acme Growth S.A.S."
            className={`${inputClass} pl-10`}
            required
          />
        </div>
      </div>

      {/* Fila Doble: Sector & Tamaño de Equipo */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="industry" className={labelClass}>
            Sector
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            <select
              id="industry"
              name="industry"
              defaultValue="marketing"
              className={selectClass}
            >
              <option value="marketing" className="bg-[#111827]">Marketing</option>
              <option value="software" className="bg-[#111827]">Software & TI</option>
              <option value="real_estate" className="bg-[#111827]">Inmobiliaria</option>
              <option value="ecommerce" className="bg-[#111827]">E-commerce</option>
              <option value="professional_services" className="bg-[#111827]">Servicios</option>
              <option value="other" className="bg-[#111827]">Otro sector</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="teamSize" className={labelClass}>
            Equipo
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            <select
              id="teamSize"
              name="teamSize"
              defaultValue="2-5"
              className={selectClass}
            >
              <option value="1" className="bg-[#111827]">Solo yo (1)</option>
              <option value="2-5" className="bg-[#111827]">2 a 5 pers.</option>
              <option value="6-20" className="bg-[#111827]">6 a 20 pers.</option>
              <option value="20+" className="bg-[#111827]">Más de 20</option>
            </select>
          </div>
        </div>
      </div>

      {/* País de Operación Principal */}
      <div>
        <label htmlFor="country" className={labelClass}>
          País de Operación Principal
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          <select
            id="country"
            name="country"
            defaultValue="CO"
            className={selectClass}
          >
            <option value="CO" className="bg-[#111827]">🇨🇴 Colombia (COP - Pesos)</option>
            <option value="MX" className="bg-[#111827]">🇲🇽 México (MXN - Pesos)</option>
            <option value="US" className="bg-[#111827]">🇺🇸 Estados Unidos (USD - Dólares)</option>
            <option value="ES" className="bg-[#111827]">🇪🇸 España / Europa (EUR - Euros)</option>
            <option value="OTHER" className="bg-[#111827]">🌎 Otro país (USD)</option>
          </select>
        </div>
      </div>

      {/* Nombre del Administrador */}
      <div>
        <label htmlFor="adminName" className={labelClass}>
          Tu Nombre Completo
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            id="adminName"
            name="adminName"
            placeholder="Carlos Rodríguez"
            className={`${inputClass} pl-10`}
            required
          />
        </div>
      </div>

      {/* Correo Electrónico */}
      <div>
        <label htmlFor="email" className={labelClass}>
          Correo Electrónico Laboral
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            id="email"
            name="email"
            type="email"
            placeholder="carlos@tuempresa.com"
            className={`${inputClass} pl-10`}
            required
          />
        </div>
      </div>

      {/* Contraseña con Toggle */}
      <div>
        <label htmlFor="password" className={labelClass}>
          Contraseña Segura
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            className={`${inputClass} pl-10 pr-10`}
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Botón de Submit idéntico a Login */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-teal-500 to-teal-400 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-teal-500/25 transition-all outline-none text-xs mt-2"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Aprovisionando Espacio...
          </span>
        ) : (
          "Crear Espacio de Trabajo"
        )}
      </Button>

      <p className="text-center text-[10px] text-slate-500 pt-1 leading-relaxed">
        Al crear tu cuenta, aceptas nuestros Términos de Servicio y Políticas de Privacidad.
      </p>
    </form>
  );
}
