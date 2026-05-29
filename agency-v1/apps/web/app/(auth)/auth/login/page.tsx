"use client";

import { useActionState, useEffect, useState, Suspense } from "react";
import { useFormStatus } from "react-dom";
import { loginUser, loginWithOAuth } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { HologramGlobe } from "@/components/auth/hologram-globe";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-400 text-white font-medium py-5 lg:py-6 rounded-lg shadow-lg hover:shadow-teal-500/25 transition-all outline-none"
        >
            {pending ? "Iniciando sesión..." : "Sign In"}
        </Button>
    );
}

function DeletedAlert() {
    const searchParams = useSearchParams();
    const isDeleted = searchParams.get("deleted") === "1";

    if (!isDeleted) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/50 text-amber-400 px-4 py-3 rounded-lg flex items-center text-sm mb-6"
        >
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <p>Tu sesión ha expirado o tu usuario fue eliminado de la base de datos. Por favor, inicia sesión de nuevo.</p>
        </motion.div>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const [errorMessage, dispatch, isPending] = useActionState(loginUser, undefined);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!isPending && errorMessage === undefined) {
            const hasSubmitted = sessionStorage.getItem('loginAttempted');
            if (hasSubmitted) {
                sessionStorage.removeItem('loginAttempted');
                router.push('/dashboard');
            }
        }
    }, [errorMessage, isPending, router]);

    const handleSubmit = (formData: FormData) => {
        sessionStorage.setItem('loginAttempted', 'true');
        dispatch(formData);
    };

    return (
        <div className="min-h-screen w-full flex bg-[#0B0F19] text-white relative overflow-hidden">
            {/* Elementos de fondo Premium acordes al Landing */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />

                {/* Figuras del Mockup flotantes abstractas */}
                <div className="hidden lg:block absolute left-[15%] top-[15%] w-[350px] h-[350px] border-[1px] border-white/5 rounded-[50px] rotate-45" />
                <div className="hidden lg:block absolute left-[5%] bottom-[5%] w-[450px] h-[450px] border-[1px] border-white/5 rounded-full" />

                {/* Background Noise de Legacymark */}
                <div className="bg-noise absolute inset-0 mix-blend-multiply opacity-[0.02]" />
            </div>

            {/* Lado Izquierdo: Branding (Oculto en móviles) */}
            <div className="hidden lg:flex flex-col flex-1 px-16 py-12 relative z-10 max-w-[50%] xl:max-w-[60%]">
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

                <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-8 items-center mt-6">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex flex-col justify-center"
                    >
                        <h1 className="text-5xl xl:text-6xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Welcome!
                        </h1>
                        <div className="w-16 h-1 bg-teal-500 mb-8 rounded-full" />
                        <p className="text-slate-400 text-sm xl:text-base max-w-sm leading-relaxed">
                            Gestiona tus proyectos, agiliza tus operaciones y domina el ecosistema digital desde tu nuevo panel de control.
                        </p>

                        <Link href="/auth/register">
                            <Button variant="outline" className="mt-8 border-white/10 text-white hover:bg-white/5 hover:text-white bg-transparent rounded-full px-8 py-2 w-fit">
                                Crear Cuenta Nueva
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Holograma del Globo Terráqueo Digital */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="relative w-full h-[640px] xl:h-[800px] flex items-center justify-center"
                    >
                        {/* Glow effect surrounding the hologram container */}
                        <div className="absolute w-[480px] h-[480px] xl:w-[600px] xl:h-[600px] bg-teal-500/10 blur-[80px] rounded-full animate-pulse" />
                        
                        {/* Tech Ring HUD styling */}
                        <div className="absolute w-[560px] h-[560px] xl:w-[680px] xl:h-[680px] border border-teal-500/20 rounded-full animate-[spin_40s_linear_infinite]" />
                        <div className="absolute w-[600px] h-[600px] xl:w-[720px] xl:h-[720px] border border-dashed border-purple-500/15 rounded-full animate-[spin_60s_linear_infinite_reverse]" />
                        
                        <HologramGlobe />
                    </motion.div>
                </div>
            </div>

            {/* Lado Derecho: Contenedor del Formulario Glassmorphism */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-16 relative z-10 bg-black/20 lg:bg-transparent backdrop-blur-3xl lg:backdrop-blur-none">

                {/* Logo fallback en móviles */}
                <div className="lg:hidden mb-12 relative w-20 h-20">
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

                {/* Tarjeta Glassmorphic */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-[420px] bg-[#1a1f2e]/60 backdrop-blur-2xl border border-white/5 p-8 sm:p-10 rounded-2xl shadow-2xl relative"
                >
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                            Sign in
                        </h2>
                        <div className="w-8 h-0.5 bg-teal-500/50 mt-2 mb-8" />
                    </div>

                    <form action={handleSubmit} className="space-y-6">
                        <Suspense fallback={null}>
                            <DeletedAlert />
                        </Suspense>

                        {errorMessage && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center text-sm"
                            >
                                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                <p>{errorMessage}</p>
                            </motion.div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                                Correo Electrónico
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="tu@email.com"
                                className="block w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    placeholder="••••••••"
                                    className="block w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors sm:text-sm pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <SubmitButton />
                        </div>
                    </form>

                    {/* Separador */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
                            <span className="bg-[#1a1f2e] px-3 text-slate-500 font-mono">O continúa con</span>
                        </div>
                    </div>

                    {/* Grilla Premium de Proveedores OAuth */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {[
                            {
                                id: "google",
                                name: "Google",
                                icon: (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                    </svg>
                                )
                            },
                            {
                                id: "microsoft-entra-id",
                                name: "Microsoft",
                                icon: (
                                    <svg className="w-4 h-4" viewBox="0 0 23 23" fill="currentColor">
                                        <path d="M0 0h11v11H0z" fill="#F25022"/>
                                        <path d="M12 0h11v11H12z" fill="#7FBA00"/>
                                        <path d="M0 12h11v11H0z" fill="#00A4EF"/>
                                        <path d="M12 12h11v11H12z" fill="#FFB900"/>
                                    </svg>
                                )
                            },
                            {
                                id: "github",
                                name: "GitHub",
                                icon: (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                                    </svg>
                                )
                            },
                            {
                                id: "facebook",
                                name: "Facebook",
                                icon: (
                                    <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                    </svg>
                                )
                            }
                        ].map((provider) => (
                            <button
                                key={provider.id}
                                type="button"
                                onClick={() => loginWithOAuth(provider.id)}
                                className="flex items-center justify-center gap-2.5 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 hover:border-teal-500/50 active:scale-95 transition-all duration-200 text-xs font-semibold shadow-md group"
                            >
                                <span className="group-hover:scale-110 transition-transform">{provider.icon}</span>
                                <span>{provider.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-500 mt-2">
                        <Link href="/auth/recuperar" className="hover:text-teal-400 transition-colors">
                            Recuperar contraseña
                        </Link>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <Link href="/contacto" className="hover:text-teal-400 transition-colors">
                            Soporte
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
