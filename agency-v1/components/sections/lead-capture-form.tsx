"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
    name: z.string().min(2, "Nombre requerido"),
    email: z.string().email("Email válido requerido"),
});

type FormValues = z.infer<typeof formSchema>;

interface LeadCaptureFormProps {
    resourceId: string;
    source?: string;
    buttonText?: string;
}

export function LeadCaptureForm({ 
    resourceId, 
    source = "lead_magnet", 
    buttonText = "Descargar Guía Gratis" 
}: LeadCaptureFormProps) {
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });

    async function onSubmit(data: FormValues) {
        setIsLoading(true);
        try {
            const response = await fetch("/api/public/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    resourceId,
                    source
                }),
            });

            if (response.ok) {
                setIsSuccess(true);
                reset();
                toast.success("¡Listo! Revisa tu email para descargar la guía.");
                setTimeout(() => setIsSuccess(false), 8000);
            } else {
                toast.error("Error al enviar. Por favor intenta de nuevo.");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Error de conexión. Por favor intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    }

    if (isSuccess) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">¡Listo!</h3>
                <p className="text-slate-400 mt-2">Revisa tu email para descargar la guía.</p>
                <p className="text-slate-500 text-sm mt-4">
                    ¿No te llegó? <a href="mailto:hola@legacymarksas.com" className="text-teal-400 hover:underline">Escríbenos</a>
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <Input
                    placeholder="Tu nombre completo"
                    {...register("name")}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500 h-11"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
                <Input
                    type="email"
                    placeholder="Tu email profesional"
                    {...register("email")}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500 h-11"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <Button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold h-12"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                    </>
                ) : (
                    buttonText
                )}
            </Button>
            <p className="text-xs text-slate-500 text-center">
                🔒 No spam. Solo contenido valioso. Puedes darte de baja cuando quieras.
            </p>
        </form>
    );
}