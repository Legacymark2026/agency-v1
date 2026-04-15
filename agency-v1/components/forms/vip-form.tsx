"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { submitVIPLead } from "@/actions/vip-action";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const formSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    company: z.string().optional(),
    note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function VIPForm() {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState("");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            company: "",
            note: ""
        }
    });

    async function onSubmit(data: FormValues) {
        setStatus('submitting');
        try {
            const result = await submitVIPLead(data);
            if (result.success) {
                setStatus('success');
            } else {
                setErrorMessage(result.error || "Error al procesar. Intenta nuevamente.");
                setStatus('error');
            }
        } catch (e) {
            setErrorMessage("Error de conexión. Verifica tu internet.");
            setStatus('error');
        }
    }

    if (status === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full text-center bg-[#0a0a0a] rounded-xl border border-green-500/20 shadow-2xl overflow-hidden p-8"
            >
                <div className="flex flex-col items-center gap-6 py-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 rounded-full" />
                        <div className="relative h-20 w-20 rounded-full bg-green-900/20 border border-green-500/30 flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-400" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-3xl font-bold text-white">¡Bienvenido!</h3>
                        <p className="text-gray-400 max-w-xs mx-auto text-sm leading-relaxed">
                            {form.getValues("name")}, hemos activado tu <span className="text-green-400 font-medium">Protocolo VIP</span>.
                            <br />
                            Un estratega senior revisará tu caso en las próximas horas.
                        </p>
                    </div>

                    <MagneticButton className="mt-4 w-full">
                        <Button
                            onClick={() => window.location.href = '/'}
                            variant="outline"
                            className="w-full border-green-500/20 text-green-400 hover:bg-green-500/10 hover:text-green-300 font-medium tracking-wide"
                        >
                            Volver al Inicio
                        </Button>
                    </MagneticButton>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="w-full bg-[#0a0a0a]/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Form Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Acceso Habilitado
                    </h2>
                    <span className="text-xs text-gray-500 font-mono">SECURE::V2</span>
                </div>
            </div>

            <div className="p-6 space-y-5">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400 ml-1">Tus Datos</label>
                        <Input
                            {...form.register("name")}
                            placeholder="Nombre Completo"
                            className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:bg-purple-500/5 transition-all h-11"
                        />
                        {form.formState.errors.name && (
                            <span className="text-xs text-red-400 pl-1">{form.formState.errors.name.message}</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Input
                            {...form.register("email")}
                            type="email"
                            placeholder="Email Corporativo"
                            className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:bg-purple-500/5 transition-all h-11"
                        />
                        {form.formState.errors.email && (
                            <span className="text-xs text-red-400 pl-1">{form.formState.errors.email.message}</span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            {...form.register("phone")}
                            placeholder="WhatsApp / Tel"
                            className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50 transition-all h-11"
                        />
                        <Input
                            {...form.register("company")}
                            placeholder="Empresa / Web"
                            className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50 transition-all h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400 ml-1">¿Cómo podemos ayudarte hoy?</label>
                        <Textarea
                            {...form.register("note")}
                            placeholder="Quiero escalar mis ventas, mejorar mi branding, etc..."
                            className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:bg-purple-500/5 transition-all resize-none min-h-[80px]"
                        />
                    </div>

                    {status === 'error' && (
                        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/20 p-3 rounded border border-red-900/30">
                            <AlertCircle className="h-4 w-4" />
                            {errorMessage}
                        </div>
                    )}

                    <MagneticButton className="w-full pt-1">
                        <Button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="w-full h-12 bg-white text-black hover:bg-gray-200 font-bold text-base rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {status === 'submitting' ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Desbloquear Acceso VIP <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </MagneticButton>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 pt-2 opacity-60">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Datos encriptados. 0% Spam garantizado.</span>
                    </div>
                </form>
            </div>
        </div>
    );
}
