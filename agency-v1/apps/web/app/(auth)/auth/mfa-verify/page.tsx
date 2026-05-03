"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { verifyMfaAction } from "@/actions/auth";

export default function MfaVerifyPage() {
    const router = useRouter();
    const { update } = useSession();
    
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Focus first input on mount
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (index: number, value: string) => {
        if (!/^[0-9]*$/.test(value)) return;
        
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData) {
            const newCode = [...code];
            for (let i = 0; i < pastedData.length; i++) {
                newCode[i] = pastedData[i];
            }
            setCode(newCode);
            // Focus last filled input
            const nextIndex = Math.min(pastedData.length, 5);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            setError("Por favor ingresa los 6 dígitos");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await verifyMfaAction(fullCode);
            
            if (result.error) {
                setError(result.error);
                setCode(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            } else if (result.success) {
                // Actualizar la sesión para reflejar que MFA fue verificado
                await update({ mfaVerified: true });
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err) {
            setError("Error al verificar el código");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#0B0F19] text-white relative overflow-hidden">
            {/* Elementos de fondo Premium */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="hidden lg:block absolute left-[15%] top-[15%] w-[350px] h-[350px] border-[1px] border-white/5 rounded-[50px] rotate-45" />
                <div className="bg-noise absolute inset-0 mix-blend-multiply opacity-[0.02]" />
            </div>

            <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-16 relative z-10">
                
                <div className="mb-12 relative w-[240px] h-[60px]">
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
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-[420px] bg-[#1a1f2e]/60 backdrop-blur-2xl border border-white/5 p-8 sm:p-10 rounded-2xl shadow-2xl relative"
                >
                    <Link href="/auth/login" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 mb-6 w-fit text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </Link>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                            Seguridad 2FA
                        </h2>
                        <div className="w-8 h-0.5 bg-teal-500/50 mt-2 mb-4" />
                        <p className="text-slate-400 text-sm">
                            Ingresa el código de 6 dígitos generado por tu aplicación de autenticación (Google Authenticator, Authy, etc).
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center text-sm"
                            >
                                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                <p>{error}</p>
                            </motion.div>
                        )}

                        <div className="flex justify-between gap-2 sm:gap-4" onPaste={handlePaste}>
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => {
                                        inputRefs.current[index] = el;
                                    }}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                    autoComplete="off"
                                />
                            ))}
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || code.some(d => d === '')}
                            className="w-full bg-gradient-to-r from-teal-500 to-teal-400 text-white font-medium py-6 rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all outline-none"
                        >
                            {isLoading ? "Verificando..." : "Verificar Código"}
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
