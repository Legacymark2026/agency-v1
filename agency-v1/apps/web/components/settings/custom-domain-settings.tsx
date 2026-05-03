"use client";

import { Globe, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { updateCustomDomain } from "@/app/actions/settings";

export function CustomDomainSettings({ initialData }: { initialData?: any }) {
    const [domain, setDomain] = useState(initialData?.whiteLabeling?.domain || "app.miempresa.com");
    const [status, setStatus] = useState<"pending" | "active" | "error">("active");
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = async () => {
        setIsVerifying(true);
        setStatus("pending");

        const result = await updateCustomDomain(domain);
        
        if (result.success) {
            setStatus("active");
            toast.success("Dominio verificado y guardado", {
                description: "El certificado SSL ha sido provisto automáticamente."
            });
        } else {
            setStatus("error");
            toast.error("Error al guardar el dominio");
        }
        setIsVerifying(false);
    };

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm mt-6">
            <div className="p-6 border-b border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 shrink-0 border border-sky-500/20">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Dominio Personalizado</h3>
                        <p className="text-sm text-slate-400 mt-1 max-w-lg">
                            Usa tu propio dominio para que tus clientes y equipo accedan al CRM (ej. crm.tuempresa.com).
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="w-full sm:max-w-md relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-slate-500 text-sm">https://</span>
                        </div>
                        <Input
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="crm.tudominio.com"
                            className="pl-16 font-mono text-sm bg-slate-950 border-slate-700 text-white"
                        />
                    </div>
                    <Button
                        onClick={handleVerify}
                        disabled={isVerifying || !domain}
                        className="w-full sm:w-auto"
                    >
                        {isVerifying ? (
                            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Verificando...</>
                        ) : (
                            "Guardar y Verificar"
                        )}
                    </Button>
                </div>

                {domain && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-white text-sm">Estado de Configuración DNS</h4>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                {status === 'active' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {status === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
                                {status === 'active' ? 'Conectado SSL' : status === 'error' ? 'Error DNS' : 'Verificación Pendiente'}
                            </span>
                        </div>

                        <p className="text-sm text-slate-400 mb-4">
                            Para conectar tu dominio, añade el siguiente registro CNAME en la configuración DNS de tu proveedor (GoDaddy, Cloudflare, Namecheap, etc).
                        </p>

                        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-950 border-b border-slate-800/60 text-slate-400">
                                        <th className="px-4 py-2 font-medium">Tipo</th>
                                        <th className="px-4 py-2 font-medium">Nombre (Host)</th>
                                        <th className="px-4 py-2 font-medium">Valor (Target)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-white font-semibold">CNAME</td>
                                        <td className="px-4 py-3 font-mono text-slate-300">{domain.split('.')[0] || 'crm'}</td>
                                        <td className="px-4 py-3 font-mono text-sky-400 select-all">cname.legacymark.com</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
