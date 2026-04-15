"use client";

import { Globe, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export function CustomDomainSettings() {
    const [domain, setDomain] = useState("app.miempresa.com");
    const [status, setStatus] = useState<"pending" | "active" | "error">("active");
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = () => {
        setIsVerifying(true);
        setStatus("pending");

        setTimeout(() => {
            setIsVerifying(false);
            setStatus("active");
            toast.success("Dominio verificado correctamente", {
                description: "El certificado SSL ha sido provisto automáticamente."
            });
        }, 2000);
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm mt-6">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-sky-100 text-sky-600 shrink-0">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Dominio Personalizado</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-lg">
                            Usa tu propio dominio para que tus clientes y equipo accedan al CRM (ej. crm.tuempresa.com).
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="w-full sm:max-w-md relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-slate-400 text-sm">https://</span>
                        </div>
                        <Input
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="crm.tudominio.com"
                            className="pl-16 font-mono text-sm"
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
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-slate-900 text-sm">Estado de Configuración DNS</h4>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                    status === 'error' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                }`}>
                                {status === 'active' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {status === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
                                {status === 'active' ? 'Conectado SSL' : status === 'error' ? 'Error DNS' : 'Verificación Pendiente'}
                            </span>
                        </div>

                        <p className="text-sm text-slate-600 mb-4">
                            Para conectar tu dominio, añade el siguiente registro CNAME en la configuración DNS de tu proveedor (GoDaddy, Cloudflare, Namecheap, etc).
                        </p>

                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                        <th className="px-4 py-2 font-medium">Tipo</th>
                                        <th className="px-4 py-2 font-medium">Nombre (Host)</th>
                                        <th className="px-4 py-2 font-medium">Valor (Target)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-3 font-mono text-slate-900 font-semibold">CNAME</td>
                                        <td className="px-4 py-3 font-mono text-slate-600">{domain.split('.')[0]}</td>
                                        <td className="px-4 py-3 font-mono text-blue-600 select-all">cname.legacymark.com</td>
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
