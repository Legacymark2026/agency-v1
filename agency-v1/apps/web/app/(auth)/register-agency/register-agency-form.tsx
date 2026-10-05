"use client";

import { useState, useEffect } from "react";
import { registerAgency } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building, User, Mail, Lock, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getClientDeviceSignals, computeClientDeviceHash } from "@/lib/client-fingerprint";

export function RegisterAgencyForm() {
  const [loading, setLoading] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Extraer y computar la huella digital del dispositivo en segundo plano de manera no bloqueante
    try {
      const signals = getClientDeviceSignals();
      computeClientDeviceHash(signals).then((hash) => {
        if (hash) {
          setDeviceFingerprint(hash);
        }
      });
    } catch (e) {
      // Ignorar de forma resiliente si el navegador restringe alguna API
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
        toast.error(!res.success && typeof (res as any).message === 'string' ? (res as any).message : "Error al crear la agencia.");
      } else {
        toast.success("¡Agencia creada con éxito! Ahora puedes iniciar sesión.");
        router.push(res.data.redirectTo);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 w-full max-w-sm">
      <input type="hidden" name="deviceFingerprint" value={deviceFingerprint} />
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agencyName" className="text-slate-300">Nombre de la Empresa / Agencia</Label>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input 
              id="agencyName" 
              name="agencyName" 
              placeholder="Acme Marketing S.A.S." 
              className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200 focus-visible:ring-teal-500" 
              required 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry" className="text-slate-300">Sector o Industria</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <select
              id="industry"
              name="industry"
              defaultValue="marketing"
              className="w-full h-9 rounded-md pl-10 pr-3 text-sm bg-slate-900/50 border border-slate-800 text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
            >
              <option value="marketing" className="bg-slate-900 text-slate-200">Marketing & Publicidad</option>
              <option value="software" className="bg-slate-900 text-slate-200">Tecnología & Software</option>
              <option value="real_estate" className="bg-slate-900 text-slate-200">Bienes Raíces / Inmobiliaria</option>
              <option value="ecommerce" className="bg-slate-900 text-slate-200">Comercio Electrónico / Retail</option>
              <option value="professional_services" className="bg-slate-900 text-slate-200">Consultoría & Servicios</option>
              <option value="other" className="bg-slate-900 text-slate-200">Otro sector</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminName" className="text-slate-300">Tu Nombre Completo</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input 
              id="adminName" 
              name="adminName" 
              placeholder="Carlos Rodríguez" 
              className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200 focus-visible:ring-teal-500" 
              required 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-300">Correo Electrónico Laboral</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="carlos@empresa.com" 
              className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200 focus-visible:ring-teal-500" 
              required 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-300">Contraseña Segura</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200 focus-visible:ring-teal-500" 
              required 
              minLength={8}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear mi Cuenta de Agencia"}
      </Button>

      <div className="text-center text-sm text-slate-500 mt-4">
        Al crear tu cuenta, aceptas nuestros Términos de Servicio y Políticas de Privacidad.
      </div>
    </form>
  );
}
