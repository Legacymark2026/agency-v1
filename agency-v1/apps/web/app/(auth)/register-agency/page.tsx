"use client";

import { RegisterAgencyForm } from "./register-agency-form";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HologramGlobe } from "@/components/auth/hologram-globe";

export default function RegisterAgencyPage() {
  return (
    <div className="min-h-screen w-full flex bg-[#0B0F19] text-white relative overflow-hidden">
      {/* Elementos de fondo Premium acordes al Landing y Login */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />

        {/* Figuras del Mockup flotantes abstractas */}
        <div className="hidden lg:block absolute left-[15%] top-[15%] w-[350px] h-[350px] border-[1px] border-white/5 rounded-[50px] rotate-45" />
        <div className="hidden lg:block absolute left-[5%] bottom-[5%] w-[450px] h-[450px] border-[1px] border-white/5 rounded-full" />

        {/* Background Noise de LegacyMark */}
        <div className="bg-noise absolute inset-0 mix-blend-multiply opacity-[0.02]" />
      </div>

      {/* Lado Izquierdo: Branding, Título y HologramGlobe (Oculto en móviles) */}
      <div className="hidden lg:flex flex-col flex-1 px-12 xl:px-16 py-10 relative z-10 max-w-[50%] xl:max-w-[52%] justify-between">
        <div className="flex-none">
          <Link href="/" className="inline-block relative w-16 h-16 hover:scale-105 transition-transform">
            <Image
              src="/favicon.ico"
              alt="LegacyMark"
              fill
              className="object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
              priority
            />
          </Link>
        </div>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 items-center my-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col justify-center"
          >
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Escala tu Agencia
            </h1>
            <div className="w-16 h-1 bg-teal-500 mb-6 rounded-full" />
            <p className="text-slate-400 text-sm xl:text-base max-w-sm leading-relaxed mb-6">
              Aprovisiona tu espacio de trabajo B2B con motores inteligentes, automatización y facturación electrónica en segundos.
            </p>

            <Link href="/auth/login">
              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5 hover:text-white bg-transparent rounded-full px-8 py-2 w-fit text-xs"
              >
                ¿Ya tienes cuenta? Inicia Sesión
              </Button>
            </Link>
          </motion.div>

          {/* Holograma del Globo Terráqueo Digital */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative w-full h-[500px] xl:h-[620px] flex items-center justify-center"
          >
            {/* Glow effect surrounding the hologram container */}
            <div className="absolute w-[420px] h-[420px] xl:w-[520px] xl:h-[520px] bg-teal-500/10 blur-[80px] rounded-full animate-pulse" />
            
            {/* Tech Ring HUD styling */}
            <div className="absolute w-[480px] h-[480px] xl:w-[580px] xl:h-[580px] border border-teal-500/20 rounded-full animate-[spin_40s_linear_infinite]" />
            <div className="absolute w-[520px] h-[520px] xl:w-[620px] xl:h-[620px] border border-dashed border-purple-500/15 rounded-full animate-[spin_60s_linear_infinite_reverse]" />
            
            <HologramGlobe />
          </motion.div>
        </div>

        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} LegacyMark SaaS. Todos los derechos reservados.
        </div>
      </div>

      {/* Lado Derecho: Contenedor del Formulario Glassmorphism */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-10 py-10 relative z-10 bg-black/20 lg:bg-transparent backdrop-blur-3xl lg:backdrop-blur-none overflow-y-auto">
        {/* Logo fallback en móviles */}
        <div className="lg:hidden mb-6 relative w-16 h-16">
          <Link href="/">
            <Image
              src="/favicon.ico"
              alt="LegacyMark"
              fill
              className="object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
              priority
            />
          </Link>
        </div>

        {/* Tarjeta Glassmorphic idéntica a la del Login */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[460px] bg-[#1a1f2e]/60 backdrop-blur-2xl border border-white/5 p-6 sm:p-8 rounded-2xl shadow-2xl relative"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
              Crea tu Espacio B2B
            </h2>
            <p className="text-slate-400 text-xs">
              Prueba gratuita de 14 días. Sin tarjeta de crédito requerida.
            </p>
          </div>

          <RegisterAgencyForm />

          {/* Footer Link en móviles / pie de tarjeta */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-xs text-slate-400">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/auth/login" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
