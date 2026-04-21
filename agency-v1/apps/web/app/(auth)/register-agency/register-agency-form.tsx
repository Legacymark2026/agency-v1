"use client";

import { useState } from "react";
import { registerAgency } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building, User, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function RegisterAgencyForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await registerAgency(formData);

      if (!res.success) {
        toast.error((res as any).error || "Error al crear la agencia.");
      } else {
        toast.success("¡Agencia creada! Ahora puedes iniciar sesión.");
        router.push(res.data.redirectTo);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 w-full max-w-sm">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agencyName" className="text-slate-300">Nombre de la Agencia / Negocio</Label>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input 
              id="agencyName" 
              name="agencyName" 
              placeholder="Acme Marketing" 
              className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200 focus-visible:ring-teal-500" 
              required 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminName" className="text-slate-300">Tu Nombre</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input 
              id="adminName" 
              name="adminName" 
              placeholder="John Doe" 
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
              placeholder="john@acme.com" 
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
