"use client";

import { useState, useEffect } from "react";
import { Wallet, Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PayuIntegrations() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [status, setStatus] = useState({ isConfigured: false, hasApiKey: false, hasMerchantId: false, hasAccountId: false, isTest: false });
    
    const [formData, setFormData] = useState({
        apiKey: "",
        merchantId: "",
        accountId: "",
        isTest: false
    });

    useEffect(() => {
        const fetchStatus = async () => {
             try {
                 const res = await fetch("/api/admin/integrations/payu");
                 if (res.ok) {
                     const data = await res.json();
                     setStatus(data);
                     if (data.isConfigured) {
                        setFormData(prev => ({ ...prev, isTest: data.isTest }));
                     }
                 }
             } catch (error) {
                 console.error("Error fetching PayU settings", error);
             } finally {
                 setIsFetching(false);
             }
        };
        fetchStatus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.apiKey || !formData.merchantId || !formData.accountId) {
             toast.error("Todos los campos clave son obligatorios.");
             return;
        }

        try {
             setIsLoading(true);
             const res = await fetch("/api/admin/integrations/payu", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify(formData)
             });

             if (!res.ok) throw new Error("Error al guardar PayU");

             toast.success("PayU configurado correctamente en LegacyMark.");
             setStatus({ isConfigured: true, hasApiKey: true, hasMerchantId: true, hasAccountId: true, isTest: formData.isTest });
             setFormData({ apiKey: "", merchantId: "", accountId: "", isTest: formData.isTest });
             router.refresh();
        } catch (error) {
             toast.error("Hubo un error configurando PayU, verifica permisos.");
        } finally {
             setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
             <div className="p-6 border-b border-slate-800 flex items-center gap-4">
                 <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
                     <Wallet className="h-6 w-6" />
                 </div>
                 <div>
                     <h3 className="font-bold text-white text-lg">PayU (Latam)</h3>
                     <p className="text-sm text-slate-400">Cobros por PSE, Tarjetas y Billeteras</p>
                 </div>
             </div>

             <div className="p-6 flex-1 flex flex-col">
                 {isFetching ? (
                     <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>
                 ) : status.isConfigured ? (
                     <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex gap-3">
                         <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                         <div>
                             <p className="text-sm font-medium text-emerald-400">Integración con PayU Activa</p>
                             <p className="text-xs text-emerald-400/80 mt-1">
                                {status.isTest ? "Actualmente conectada en MODO PRUEBAS (Sandbox)." : "Lista para procesar operaciones en PRODUCCIÓN con dinero real."}
                             </p>
                         </div>
                     </div>
                 ) : (
                      <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3">
                         <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                         <div>
                             <p className="text-sm font-medium text-amber-400">Pendiente de Configuración</p>
                             <p className="text-xs text-amber-400/80 mt-1">Configura credenciales de PayU para agregar la pasarela PSE a tus facturas.</p>
                         </div>
                     </div>
                 )}

                 <form onSubmit={handleSubmit} className="space-y-4 mt-auto">
                     <div className="space-y-2">
                         <label className="text-xs font-medium text-slate-300">API Key</label>
                         <input
                             type="password"
                             placeholder={status.hasApiKey ? "••••••••••••••••••••••••" : "4Vj8eK4rloUd272L48hsrarnUA"}
                             className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                             value={formData.apiKey}
                             onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                             required={!status.hasApiKey}
                         />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-300">Merchant ID</label>
                            <input
                                type="text"
                                placeholder={status.hasMerchantId ? "••••••••••" : "Ej: 508029"}
                                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                                value={formData.merchantId}
                                onChange={(e) => setFormData(prev => ({ ...prev, merchantId: e.target.value }))}
                                required={!status.hasMerchantId}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-300">Account ID</label>
                            <input
                                type="text"
                                placeholder={status.hasAccountId ? "••••••••••" : "Ej: 512321"}
                                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                                value={formData.accountId}
                                onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                                required={!status.hasAccountId}
                            />
                        </div>
                     </div>
                     <div className="flex items-center space-x-2 pt-2">
                         <input 
                            type="checkbox" 
                            id="payuTestMode" 
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-900 border-slate-700"
                            checked={formData.isTest}
                            onChange={(e) => setFormData(prev => ({ ...prev, isTest: e.target.checked }))}
                         />
                         <label htmlFor="payuTestMode" className="text-sm font-medium text-slate-300 cursor-pointer">
                             Activar Entorno de Pruebas (Sandbox)
                         </label>
                     </div>

                     <button
                         type="submit"
                         disabled={isLoading}
                         className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50 transition-colors mt-6"
                     >
                         {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                         Guardar Credenciales
                     </button>
                 </form>
             </div>
        </div>
    );
}
