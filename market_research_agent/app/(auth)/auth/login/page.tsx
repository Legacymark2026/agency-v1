"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { loginUser, loginWithOAuth } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

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
            <div className="hidden lg:flex flex-col flex-1 px-16 py-12 relative z-10">
                <div className="flex-1">
                    <Link href="/" className="inline-block relative w-[420px] h-[105px] hover:scale-105 transition-transform">
                        <Image
                            src="/logo.png"
                            alt="LegacyMark"
                            fill
                            className="object-contain"
                            style={{ filter: "brightness(0) invert(1)" }}
                            priority
                        />
                    </Link>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <h1 className="text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Welcome!
                        </h1>
                        <div className="w-16 h-1 bg-teal-500 mb-8 rounded-full" />
                        <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                            Gestiona tus proyectos, agiliza tus operaciones y domina el ecosistema digital desde tu nuevo panel de control.
                        </p>

                        <Link href="/auth/register">
                            <Button variant="outline" className="mt-8 border-white/10 text-white hover:bg-white/5 hover:text-white bg-transparent rounded-full px-8 py-2 w-fit">
                                Crear Cuenta Nueva
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Lado Derecho: Contenedor del Formulario Glassmorphism */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-16 relative z-10 bg-black/20 lg:bg-transparent backdrop-blur-3xl lg:backdrop-blur-none">

                {/* Logo fallback en móviles */}
                <div className="lg:hidden mb-12 relative w-[320px] h-[80px]">
                    <Link href="/">
                        <Image
                            src="/logo.png"
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

                    {/* Redes simplificadas basadas en el mockup */}
                    <div className="mt-8 flex flex-col items-center gap-4">
                        <div className="flex gap-4">
                            <button type="button" onClick={() => loginWithOAuth('facebook')} className="text-slate-400 hover:text-white transition-colors" title="Login with Facebook">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <button type="button" onClick={() => loginWithOAuth('google')} className="text-slate-400 hover:text-white transition-colors" title="Login with Google">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <button type="button" onClick={() => loginWithOAuth('linkedin')} className="text-slate-400 hover:text-white transition-colors" title="Login with LinkedIn">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                </svg>
                            </button>
                            <button type="button" onClick={() => loginWithOAuth('tiktok')} className="text-slate-400 hover:text-white transition-colors" title="Login with TikTok">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91.04.15 1.5.76 2.92 1.68 4.09 1.15 1.48 2.8 2.45 4.67 2.8v3.91c-1.46-.02-2.9-.4-4.2-1.12-.52-.29-1-.66-1.43-1.08v8.32c0 2.22-.9 4.34-2.48 5.88-1.57 1.54-3.69 2.41-5.91 2.41-2.22 0-4.34-.87-5.9-2.41-1.58-1.54-2.48-3.66-2.48-5.88 0-2.24.9-4.36 2.48-5.9 1.56-1.55 3.68-2.42 5.9-2.42.5 0 1 .04 1.5.12V12.7c-1.63-.38-3.32-.01-4.7 1.05-1.09.83-1.78 2.1-1.92 3.48-.12 1.37.33 2.74 1.25 3.79 1.15 1.3 2.78 2.05 4.5 2.05 1.7 0 3.32-.73 4.47-2.02 1.16-1.3 1.83-3.02 1.83-4.75V4.62c-1.35.34-2.75.46-4.14.34V.021z" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                            <Link href="/auth/recuperar" className="hover:text-teal-400 transition-colors">
                                Recuperar contraseña
                            </Link>
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <Link href="/contacto" className="hover:text-teal-400 transition-colors">
                                Soporte
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
