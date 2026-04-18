"use client";

import { useState, useEffect } from "react";
import { CreditCard, Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function StripeIntegrations() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [status, setStatus] = useState({ isConfigured: false, hasSecretKey: false, hasWebhookSecret: false });
    
    const [formData, setFormData] = useState({
        secretKey: "",
        webhookSecret: ""
    });

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch("/api/admin/integrations/stripe");
                if (res.ok) {
                    const data = await res.json();
                    setStatus(data);
                }
            } catch (error) {
                console.error("Error fetching Stripe settings", error);
            } finally {
                setIsFetching(false);
            }
        };
        fetchStatus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.secretKey || !formData.webhookSecret) {
            toast.error("Ambas claves son obligatorias para la integración.");
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch("/api/admin/integrations/stripe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Error al guardar la configuración");

            toast.success("Credenciales de Stripe configuradas correctamente");
            setStatus({ isConfigured: true, hasSecretKey: true, hasWebhookSecret: true });
            setFormData({ secretKey: "", webhookSecret: "" }); // Clean up visual inputs
            router.refresh();
        } catch (error) {
            toast.error("Hubo un error configurando Stripe");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
            <div className="p-6 border-b border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <CreditCard className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">Stripe Payments</h3>
                    <p className="text-sm text-slate-400">Pasarela de pagos y facturación B2B</p>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                {isFetching ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>
                ) : status.isConfigured ? (
                    <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-emerald-400">Integración Activa</p>
                            <p className="text-xs text-emerald-400/80 mt-1">La billetera B2B está lista para procesar cobros automáticos mediante Webhooks.</p>
                        </div>
                    </div>
                ) : (
                     <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-400">Pendiente de Configuración</p>
                            <p className="text-xs text-amber-400/80 mt-1">Ingresa tus credenciales de Producción o Test para activar los cobros.</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-auto">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Stripe Secret Key (sk_live_... / sk_test_...)</label>
                        <input
                            type="password"
                            placeholder={status.hasSecretKey ? "••••••••••••••••••••••••" : "sk_..."}
                            className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                            value={formData.secretKey}
                            onChange={(e) => setFormData(prev => ({ ...prev, secretKey: e.target.value }))}
                            required={!status.hasSecretKey}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Webhook Secret (whsec_...)</label>
                        <input
                            type="password"
                            placeholder={status.hasWebhookSecret ? "••••••••••••••••••••••••" : "whsec_..."}
                            className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                            value={formData.webhookSecret}
                            onChange={(e) => setFormData(prev => ({ ...prev, webhookSecret: e.target.value }))}
                            required={!status.hasWebhookSecret}
                        />
                         <p className="text-xs text-slate-500 mt-1">La URL del Webhook debe apuntar a: <code>https://tu-dominio.com/api/webhooks/stripe</code> con el evento <code>checkout.session.completed</code>.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors mt-4"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Guardar Credenciales
                    </button>
                </form>
            </div>
        </div>
    );
}
