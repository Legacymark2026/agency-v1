"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerUser } from "@/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

const schema = z.object({
    firstName: z.string().min(2, "Mínimo 2 caracteres"),
    lastName: z.string().min(2, "Mínimo 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

const inputClass = "block w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors text-sm";
const labelClass = "block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider";

export default function RegisterPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setServerError(null);
        const result = await registerUser(data);
        if (result.error) {
            setServerError(result.error);
        } else {
            router.push("/auth/login?registered=true");
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#0B0F19] text-white relative overflow-hidden">
            {/* Fondo premium */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="hidden lg:block absolute left-[15%] top-[15%] w-[350px] h-[350px] border-[1px] border-white/5 rounded-[50px] rotate-45" />
                <div className="hidden lg:block absolute left-[5%] bottom-[5%] w-[450px] h-[450px] border-[1px] border-white/5 rounded-full" />
                <div className="bg-noise absolute inset-0 mix-blend-multiply opacity-[0.02]" />
            </div>

            {/* Lado izquierdo — Branding */}
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
                            Únete!
                        </h1>
                        <div className="w-16 h-1 bg-teal-500 mb-8 rounded-full" />
                        <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                            Crea tu cuenta y empieza a gestionar proyectos, leads y campañas desde un único panel de control.
                        </p>
                        <Link href="/auth/login">
                            <button className="mt-8 border border-white/10 text-white hover:bg-white/5 rounded-full px-8 py-2 w-fit text-sm transition-all">
                                Ya tengo cuenta
                            </button>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Lado derecho — Formulario */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-16 relative z-10 bg-black/20 lg:bg-transparent backdrop-blur-3xl lg:backdrop-blur-none py-10">
                {/* Logo móvil */}
                <div className="lg:hidden mb-8 relative w-[320px] h-[80px]">
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

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-[460px] bg-[#1a1f2e]/60 backdrop-blur-2xl border border-white/5 p-8 sm:p-10 rounded-2xl shadow-2xl relative"
                >
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Crear cuenta</h2>
                        <div className="w-8 h-0.5 bg-teal-500/50 mt-2 mb-2" />
                        <p className="text-xs text-slate-500">
                            ¿Ya tienes cuenta?{" "}
                            <Link href="/auth/login" className="text-teal-400 hover:text-teal-300 transition-colors">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Error global */}
                        {serverError && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2 text-sm"
                            >
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p>{serverError}</p>
                            </motion.div>
                        )}

                        {/* Nombre / Apellido */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className={labelClass}>Nombre</label>
                                <input id="firstName" placeholder="Juan" {...register("firstName")} className={inputClass} />
                                {errors.firstName && <p className="text-xs text-red-400 mt-1">{errors.firstName.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="lastName" className={labelClass}>Apellido</label>
                                <input id="lastName" placeholder="Pérez" {...register("lastName")} className={inputClass} />
                                {errors.lastName && <p className="text-xs text-red-400 mt-1">{errors.lastName.message}</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className={labelClass}>Correo Electrónico</label>
                            <input id="email" type="email" placeholder="tu@email.com" {...register("email")} className={inputClass} />
                            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label htmlFor="password" className={labelClass}>Contraseña</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mínimo 8 caracteres"
                                    {...register("password")}
                                    className={inputClass + " pr-12"}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
                        </div>

                        {/* Confirmar contraseña */}
                        <div>
                            <label htmlFor="confirmPassword" className={labelClass}>Confirmar Contraseña</label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Repite tu contraseña"
                                    {...register("confirmPassword")}
                                    className={inputClass + " pr-12"}
                                />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
                        </div>

                        {/* Submit */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-400 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</>
                                ) : "Crear Cuenta"}
                            </button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-xs text-slate-600">
                        Al registrarte, aceptas los{" "}
                        <Link href="/terms" className="text-teal-500/70 hover:text-teal-400 transition-colors">Términos de Servicio</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
