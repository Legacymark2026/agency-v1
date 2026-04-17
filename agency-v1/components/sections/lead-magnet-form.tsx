"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { CheckCircle2, Loader2, Send, ShieldCheck, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { submitLeadMagnetForm } from "@/actions/public-forms";
import { toast } from "sonner";

const formSchema = z.object({
    name: z.string().min(2, "El nombre es requerido"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(10, "Teléfono inválido"),
    service: z.string().min(1, "Selecciona un servicio"),
    message: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

export function LeadMagnetForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Trigger confetti on success
    useEffect(() => {
        if (isSuccess) {
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: NodeJS.Timeout = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                // since particles fall down, start a bit higher than random
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [isSuccess]);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema)
    });

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        
        try {
            const result = await submitLeadMagnetForm({ 
                ...data, 
                source: "Flyering_LeadMagnet" // <-- ESTO ES LO QUE EL NODO LEERÁ
            });
            
            if (result?.error) {
                toast.error(result.error);
                return;
            }
            
            setIsSuccess(true);
        } catch (error) {
            toast.error("Ocurrió un error inesperado al enviar el formulario.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="contact" className="py-24 bg-slate-900 text-white relative overflow-hidden isolate">

            {/* Dynamic Backgrounds */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-600/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/4" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] pointer-events-none" />

            <div className="container px-4 md:px-6 relative z-10">
                <div className="max-w-6xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-1 md:p-1 shadow-2xl overflow-hidden">
                    <div className="bg-slate-950/50 rounded-[22px] p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-16">

                        {/* Left Col: CTA Text */}
                        <div className="space-y-8 flex flex-col justify-center">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold mb-6 border border-teal-500/20">
                                    <Star size={12} fill="currentColor" /> Diagnóstico Gratuito
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white leading-tight">
                                    ¿Tu estrategia digital <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">está funcionando?</span>
                                </h2>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    Obtén una hoja de ruta clara. Sin compromiso. Nuestros expertos analizarán tu presencia actual y te entregarán un plan de acción.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    "Auditoría SEO & UX Express",
                                    "Análisis de pauta publicitaria (Ads)",
                                    "Revisión de embudos de conversión",
                                    "Propuesta de mejora con KPI's claros"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-all">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <span className="text-gray-300 font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                <ShieldCheck className="text-gray-500" size={18} />
                                <span className="text-xs text-gray-500">Tus datos están protegidos bajo estricta confidencialidad.</span>
                            </div>
                        </div>

                        {/* Right Col: Form */}
                        <div className="relative">
                            <AnimatePresence mode="wait">
                                {isSuccess ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white/5 rounded-2xl border border-white/10"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                            className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-teal-500/20"
                                        >
                                            <CheckCircle2 size={48} className="text-white" />
                                        </motion.div>
                                        <h3 className="text-3xl font-bold mb-2 text-white">¡Gracias!</h3>
                                        <p className="text-gray-400 max-w-xs mx-auto">
                                            Hemos recibido tu solicitud. Uno de nuestros estrategas te contactará en breve por WhatsApp o Email.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onSubmit={handleSubmit(onSubmit)}
                                        className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label htmlFor="lm-name" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Nombre</label>
                                                <Input
                                                    id="lm-name"
                                                    placeholder="Tu nombre completo"
                                                    {...register("name")}
                                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-teal-500 focus:ring-teal-500/20 h-12"
                                                />
                                                {errors.name && <p className="text-red-400 text-xs ml-1">{errors.name.message}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="lm-phone" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Teléfono</label>
                                                <Input
                                                    id="lm-phone"
                                                    placeholder="+57 300..."
                                                    {...register("phone")}
                                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-teal-500 focus:ring-teal-500/20 h-12"
                                                />
                                                {errors.phone && <p className="text-red-400 text-xs ml-1">{errors.phone.message}</p>}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="lm-email" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Email Corporativo</label>
                                            <Input
                                                id="lm-email"
                                                placeholder="nombre@empresa.com"
                                                type="email"
                                                {...register("email")}
                                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-teal-500 focus:ring-teal-500/20 h-12"
                                            />
                                            {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="lm-service" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Interés Principal</label>
                                            <Select onValueChange={(val) => setValue("service", val)}>
                                                <SelectTrigger id="lm-service" className="bg-white/5 border-white/10 text-white focus:border-teal-500 focus:ring-teal-500/20 h-12">
                                                    <SelectValue placeholder="Selecciona una opción..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                                    <SelectItem value="marketing">Plan de Medios / Marketing</SelectItem>
                                                    <SelectItem value="web">Diseño y Desarrollo Web</SelectItem>
                                                    <SelectItem value="branding">Branding & Identidad</SelectItem>
                                                    <SelectItem value="automation">Automatización & IA</SelectItem>
                                                    <SelectItem value="seo">SEO & Posicionamiento</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.service && <p className="text-red-400 text-xs ml-1">{errors.service.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="lm-message" className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Mensaje (Opcional)</label>
                                            <Textarea
                                                id="lm-message"
                                                placeholder="Cuéntanos brevemente tus objetivos..."
                                                {...register("message")}
                                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-teal-500 focus:ring-teal-500/20 resize-none h-24"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold h-14 rounded-xl shadow-lg shadow-teal-500/20 transform transition-all active:scale-95"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 w-5 h-5" />}
                                            {isSubmitting ? "Enviando..." : "Solicitar Mi Diagnóstico"}
                                        </Button>

                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
