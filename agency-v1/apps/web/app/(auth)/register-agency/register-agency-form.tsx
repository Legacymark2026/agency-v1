"use client";

import { useState, useEffect } from "react";
import { registerAgency } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building, User, Mail, Lock, Briefcase, Globe, Users } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getClientDeviceSignals, computeClientDeviceHash } from "@/lib/client-fingerprint";

export function RegisterAgencyForm() {
  const [loading, setLoading] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Extraer y computar la huella digital del hardware del cliente de manera no bloqueante
    try {
      const signals = getClientDeviceSignals();
      computeClientDeviceHash(signals).then((hash) => {
        if (hash) {
          setDeviceFingerprint(hash);
        }
      });
    } catch {
      // Degradar pacíficamente si el navegador restringe alguna API
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

  return (
    <form onSubmit={onSubmit} className="space-y-5 w-full max-w-sm">
      <input type="hidden" name="deviceFingerprint" value={deviceFingerprint} />
      <div className="space-y-4">
        {/* Nombre de la Empresa */}
        <div className="space-y-1.5">
          <Label htmlFor="agencyName" className="text-slate-300 text-xs font-medium uppercase tracking-wider">
            Nombre de la Empresa / Negocio
          </Label>
          <div className="relative">
            <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input 
              id="agencyName" 
              name="agencyName" 
              placeholder="Acme Growth S.A.S." 
              className="pl-10 bg-slate-900/60 border-slate-800 text-slate-200 focus-visible:ring-teal-500 h-9 text-sm" 
              required 
            />
          </div>
        </div>

        {/* Fila Doble: Sector & Tamaño de Equipo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="industry" className="text-slate-300 text-xs font-medium uppercase tracking-wider">
              Sector
            </Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
              <select
                id="industry"
                name="industry"
                defaultValue="marketing"
                className="w-full h-9 rounded-md pl-9 pr-2 text-xs bg-slate-900/60 border border-slate-800 text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
              >
                <option value="marketing" className="bg-slate-900">Marketing & Ventas</option>
                <option value="software" className="bg-slate-900">Software & TI</option>
                <option value="real_estate" className="bg-slate-900">Inmobiliaria</option>
                <option value="ecommerce" className="bg-slate-900">E-commerce</option>
                <option value="professional_services" className="bg-slate-900">Servicios / Consultoría</option>
                <option value="other" className="bg-slate-900">Otro sector</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="teamSize" className="text-slate-300 text-xs font-medium uppercase tracking-wider">
              Equipo
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
              <select
                id="teamSize"
                name="teamSize"
                defaultValue="2-5"
                className="w-full h-9 rounded-md pl-9 pr-2 text-xs bg-slate-900/60 border border-slate-800 text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
              >
                <option value="1" className="bg-slate-900">Solo yo (1)</option>
                <option value="2-5" className="bg-slate-900">2 a 5 personas</option>
                <option value="6-20" className="bg-slate-900">6 a 20 personas</option>
                <option value="20+" className="bg-slate-900">Más de 20</option>
              </select>
            </div>
          </div>
        </div>

        {/* País de Operación Principal */}
        <div className="space-y-1.5">
          <Label htmlFor="country" className="text-slate-300 text-xs font-medium uppercase tracking-wider">
            País de Operación Principal
          </Label>
          <div className="relative">
            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
            <select
              id="country"
              name="country"
              defaultValue="CO"
              className="w-full h-9 rounded-md pl-9 pr-3 text-xs bg-slate-900/60 border border-slate-800 text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
            >
              <option value="CO" className="bg-slate-900">🇨🇴 Colombia (COP - Pesos)</option>
              <option value="MX" className="bg-slate-900">🇲🇽 México (MXN - Pesos)</option>
              <option value="US" className="bg-slate-900">🇺🇸 Estados Unidos (USD - Dólares)</option>
              <option value="ES" className="bg-slate-900">🇪🇸 España / Europa (EUR - Euros)</option>
              <option value="OTHER" className="bg-slate-900">🌎 Otro país (USD)</option>
            </select>
          </div>
        </div>

        {/* Nombre del Administrador */}
        <div className="space-y-1.5">
          <Label htmlFor="adminName" className="text-slate-300 text-xs font-medium uppercase tracking-wider">
            Tu Nombre Completo
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input 
              id="adminName" 
              name="adminName" 
              placeholder="Carlos Rodríguez" 
              className="pl-10 bg-slate-900/60 border-slate-800 text-slate-200 focus-visible:ring-teal-500 h-9 text-sm" 
              required 
            />
          </div>
        </div>

        {/* Correo Electrónico */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-300 text-xs font-medium uppercase tracking-wider">
            Correo Electrónico Laboral
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="carlos@tuempresa.com" 
              className="pl-10 bg-slate-900/60 border-slate-800 text-slate-200 focus-visible:ring-teal-500 h-9 text-sm" 
              required 
            />
          </div>
        </div>

        {/* Contraseña */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-slate-300 text-xs font-medium uppercase tracking-wider">
            Contraseña Segura
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              className="pl-10 bg-slate-900/60 border-slate-800 text-slate-200 focus-visible:ring-teal-500 h-9 text-sm" 
              required 
              minLength={8}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium h-10 mt-2 shadow-lg shadow-teal-900/20">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Espacio de Trabajo"}
      </Button>

      <div className="text-center text-xs text-slate-500 pt-1">
        Al crear tu cuenta, aceptas nuestros Términos de Servicio y Políticas de Privacidad.
      </div>
    </form>
  );
}
