"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordReset } from "@/actions/auth";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-400 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {pending ? (
                <><Loader2 size={16} className="animate-spin" /> Enviando enlace...</>
            ) : (
                <><Mail size={16} /> Enviar enlace de recuperación</>
            )}
        </button>
    );
}

export default function RecuperarContrasenaPage() {
    const [state, dispatch] = useActionState(requestPasswordReset, undefined);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0F19] text-white relative overflow-hidden p-4">
            {/* Fondo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="bg-noise absolute inset-0 mix-blend-multiply opacity-[0.02]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full max-w-[420px] z-10"
            >
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/" className="relative w-[180px] h-[44px] hover:scale-105 transition-transform inline-block">
                        <Image src="/logo.png" alt="LegacyMark" fill className="object-contain" priority />
                    </Link>
                </div>

                {/* Card glassmorphism */}
                <div className="bg-[#1a1f2e]/60 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Teal top line */}
                    <div className="h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent" />

                    <div className="p-8">
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-400 transition-colors mb-8 group"
                        >
                            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                            Volver al inicio de sesión
                        </Link>

                        <AnimatePresence mode="wait">
                            {state?.success ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-4"
                                >
                                    <div className="flex justify-center mb-6">
                                        <div className="w-20 h-20 rounded-full flex items-center justify-center"
                                            style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)' }}>
                                            <CheckCircle size={36} className="text-teal-400" />
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-3">¡Revisa tu email!</h2>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                        Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                                    </p>
                                    <div className="p-4 rounded-xl text-left mb-6"
                                        style={{ background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.15)' }}>
                                        <p className="text-amber-400/80 text-xs leading-relaxed">
                                            <span className="font-bold">💡 Consejo:</span> Revisa también tu carpeta de spam. El enlace expira en <strong>1 hora</strong>.
                                        </p>
                                    </div>
                                    <Link href="/auth/login" className="text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors">
                                        Volver al inicio de sesión →
                                    </Link>
                                </motion.div>
                            ) : (
                                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 flex items-center justify-center rounded-xl shrink-0"
                                            style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)' }}>
                                            <ShieldCheck size={22} className="text-teal-400" />
                                        </div>
                                        <div>
                                            <h1 className="text-xl font-bold text-white">Recuperar contraseña</h1>
                                            <p className="text-slate-500 text-sm mt-0.5">Te enviaremos un enlace seguro</p>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {state?.error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm"
                                            >
                                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                                <p>{state.error}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <form action={dispatch} className="space-y-5">
                                        <div>
                                            <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                                                Email de tu cuenta
                                            </label>
                                            <div className="relative">
                                                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    autoComplete="email"
                                                    required
                                                    placeholder="tu@email.com"
                                                    className="block w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors text-sm"
                                                />
                                            </div>
                                        </div>
                                        <SubmitButton />
                                    </form>

                                    <p className="mt-6 text-center text-xs text-slate-600">
                                        Por seguridad, el enlace expira en 1 hora y solo puede usarse una vez.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <p className="text-center mt-6 text-xs text-slate-700">
                    © {new Date().getFullYear()} LegacyMark · Todos los derechos reservados
                </p>
            </motion.div>
        </div>
    );
}
