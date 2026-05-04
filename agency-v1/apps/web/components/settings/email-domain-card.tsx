'use client';

import { useState } from "react";
import { Mail, Shield, CheckCircle2, Copy, ExternalLink, Loader2, Globe } from "lucide-react";
import { createEmailDomainVerification } from "@/actions/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function EmailDomainCard() {
    const [domain, setDomain] = useState("");
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState<any[]>([]);

    const handleVerify = async () => {
        if (!domain || !domain.includes('.')) {
            toast.error("Por favor ingresa un dominio válido (ej. miagencia.com)");
            return;
        }

        setLoading(true);
        try {
            const res = await createEmailDomainVerification(domain);
            if (res.success && res.records) {
                setRecords(res.records);
                toast.success("Dominio registrado. Por favor configura los registros DNS.");
            } else {
                toast.error(res.error || "Error al verificar el dominio");
            }
        } catch (e: any) {
            toast.error(e.message || "Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado al portapapeles");
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shadow-inner">
                        <Mail className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            Dominio de Email Personalizado
                            {records.length > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">PENDIENTE</span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">NO CONFIGURADO</span>
                            )}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2 max-w-[280px]">
                            Envía correos directamente desde tu dominio (ej. ventas@tuempresa.com) mejorando la entregabilidad y evitando el spam.
                        </p>
                    </div>
                </div>
            </div>

            {records.length === 0 ? (
                <div className="mt-6 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="tuempresa.com"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="pl-9 bg-slate-950/50 border-slate-800 text-sm focus-visible:ring-indigo-500"
                        />
                    </div>
                    <Button
                        onClick={handleVerify}
                        disabled={loading || !domain}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar"}
                    </Button>
                </div>
            ) : (
                <div className="mt-6 space-y-4">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-start gap-3">
                        <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-white">Configuración DNS Requerida</p>
                            <p className="text-xs text-slate-400 mt-1">Agrega estos registros en tu proveedor de dominio (GoDaddy, Cloudflare, etc.) para verificar la propiedad de <strong>{domain}</strong>.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {records.map((rec, i) => (
                            <div key={i} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                        {rec.type}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Host / Nombre</p>
                                        <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                                            <code className="text-xs text-slate-300 truncate">{rec.host}</code>
                                            <button onClick={() => copyToClipboard(rec.host)} className="text-slate-500 hover:text-white">
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Valor / Destino</p>
                                        <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                                            <code className="text-xs text-slate-300 truncate">{rec.value}</code>
                                            <button onClick={() => copyToClipboard(rec.value)} className="text-slate-500 hover:text-white">
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button variant="outline" className="text-xs" onClick={() => setRecords([])}>
                            Volver
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
