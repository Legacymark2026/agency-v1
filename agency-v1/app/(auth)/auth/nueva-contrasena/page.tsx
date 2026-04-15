"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/actions/auth";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ShieldCheck, XCircle } from "lucide-react";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score, label: "Muy débil", color: "bg-red-500" };
    if (score === 2) return { score, label: "Débil", color: "bg-orange-500" };
    if (score === 3) return { score, label: "Regular", color: "bg-yellow-500" };
    if (score === 4) return { score, label: "Fuerte", color: "bg-teal-500" };
    return { score, label: "Muy fuerte", color: "bg-green-500" };
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-400 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {pending ? (
                <><Loader2 size={16} className="animate-spin" /> Actualizando contraseña...</>
            ) : (
                <><Lock size={16} /> Establecer nueva contraseña</>
            )}
        </button>
    );
}

const inputClass = "w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors text-sm";

export default function NuevaContrasenaPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [state, dispatch] = useActionState(resetPassword, undefined);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [password, setPassword] = useState("");
    const strength = getPasswordStrength(password);

    useEffect(() => {
        if (state?.success) {
            const timer = setTimeout(() => router.push("/auth/login"), 3000);
            return () => clearTimeout(timer);
        }
    }, [state?.success, router]);

    const pageShell = (children: React.ReactNode) => (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0F19] text-white relative overflow-hidden p-4">
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
                <div className="flex justify-center mb-8">
                    <Link href="/" className="relative w-[180px] h-[44px] hover:scale-105 transition-transform inline-block">
                        <Image src="/logo.png" alt="LegacyMark" fill className="object-contain" priority />
                    </Link>
                </div>
                {children}
                <p className="text-center mt-6 text-xs text-slate-700">
                    © {new Date().getFullYear()} LegacyMark · Todos los derechos reservados
                </p>
            </motion.div>
        </div>
    );

    // Token inválido
    if (!token) {
        return pageShell(
            <div className="bg-[#1a1f2e]/60 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
                <div className="h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                <div className="p-8 text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <XCircle size={36} className="text-red-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white mb-3">Enlace inválido</h1>
                    <p className="text-slate-400 text-sm mb-6">
                        Este enlace de recuperación no es válido o ha expirado.
                    </p>
                    <Link
                        href="/auth/recuperar"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-400 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-teal-500/25 transition-all"
                    >
                        Solicitar nuevo enlace
                    </Link>
                </div>
            </div>
        );
    }

    return pageShell(
        <div className="bg-[#1a1f2e]/60 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent" />
            <div className="p-8">
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
                            <h2 className="text-2xl font-bold text-white mb-3">¡Contraseña actualizada!</h2>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                Tu contraseña ha sido restablecida exitosamente. Serás redirigido al inicio de sesión en unos segundos.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-teal-400 text-sm font-medium">
                                <Loader2 size={14} className="animate-spin" />
                                Redirigiendo...
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 flex items-center justify-center rounded-xl shrink-0"
                                    style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)' }}>
                                    <ShieldCheck size={22} className="text-teal-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Nueva contraseña</h1>
                                    <p className="text-slate-500 text-sm mt-0.5">Elige una contraseña segura</p>
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
                                <input type="hidden" name="token" value={token} />

                                {/* Nueva contraseña */}
                                <div>
                                    <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                                        Nueva contraseña
                                    </label>
                                    <div className="relative">
                                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={8}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mínimo 8 caracteres"
                                            className={inputClass}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>

                                    {/* Strength bar */}
                                    {password && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2">
                                            <div className="flex gap-1 mb-1">
                                                {[1, 2, 3, 4, 5].map((i) => (
                                                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : "bg-white/10"}`} />
                                                ))}
                                            </div>
                                            <p className={`text-xs font-medium ${strength.score <= 2 ? "text-red-400" : strength.score === 3 ? "text-yellow-400" : "text-teal-400"}`}>
                                                {strength.label}
                                            </p>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Confirmar contraseña */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                                        Confirmar contraseña
                                    </label>
                                    <div className="relative">
                                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirm ? "text" : "password"}
                                            required
                                            minLength={8}
                                            placeholder="Repite tu contraseña"
                                            className={inputClass}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Requisitos */}
                                <div className="p-4 rounded-xl space-y-2"
                                    style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(30,41,59,0.8)' }}>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Requisitos</p>
                                    {[
                                        { label: "Mínimo 8 caracteres", met: password.length >= 8 },
                                        { label: "Al menos una mayúscula", met: /[A-Z]/.test(password) },
                                        { label: "Al menos un número", met: /[0-9]/.test(password) },
                                    ].map((req) => (
                                        <div key={req.label} className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${req.met ? "bg-teal-500" : "bg-white/10"}`}>
                                                {req.met && <CheckCircle size={10} className="text-white" />}
                                            </div>
                                            <span className={`text-xs transition-colors ${req.met ? "text-teal-400 font-medium" : "text-slate-500"}`}>
                                                {req.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <SubmitButton />
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
