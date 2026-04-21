import { RegisterAgencyForm } from "./register-agency-form";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crea tu Agencia - LegacyMark SaaS",
  description: "Registra tu empresa y comienza a escalar tus ventas y marketing.",
};

export default function RegisterAgencyPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background Glow Effects (HUD Style) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col items-center">
        
        {/* Header / Logo */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="h-12 w-12 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center mb-4">
             {/* Simple Logo Placeholder */}
             <div className="h-6 w-6 border-2 border-teal-400 rounded-sm" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2 tracking-tight">
            Escala tu Agencia
          </h1>
          <p className="text-slate-400 text-sm max-w-[280px]">
            Inicia tu prueba y configura tu espacio de trabajo B2B en segundos.
          </p>
        </div>

        {/* Formulario */}
        <RegisterAgencyForm />
        
        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 w-full text-center">
          <p className="text-sm text-slate-400">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/auth/signin" className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
              Inicia Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
