"use client";

import { useState, useEffect, useCallback } from "react";
import { getIntegrationHealthDashboard } from "@/actions/developer";
import { verifyIntegrationConnection } from "@/actions/integration-config";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function IntegrationsHealthSummary() {
    const [health, setHealth] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isReverifying, setIsReverifying] = useState(false);
    const [verifyProgress, setVerifyProgress] = useState<{ done: number; total: number } | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        const res = await getIntegrationHealthDashboard();
        if (res.success) setHealth(res.data);
        setTimeout(() => setIsLoading(false), 300);
    }, []);

    useEffect(() => { load(); }, [load]);

    // Re-verify all configured integrations with real API pings
    const reverifyAll = useCallback(async () => {
        setIsReverifying(true);
        setVerifyProgress(null);

        try {
            // Only verify integrations that are actually configured (not UNCONFIGURED)
            const configured = health.filter(h => h.status !== "UNCONFIGURED");
            if (configured.length === 0) {
                toast.info("No hay integraciones configuradas para verificar.");
                return;
            }

            setVerifyProgress({ done: 0, total: configured.length });

            const results: any[] = [];
            for (const item of configured) {
                try {
                    const result = await verifyIntegrationConnection(item.key);
                    results.push({
                        key: item.key,
                        status: result.ok ? "OK" : "ERROR",
                        message: result.message,
                        latencyMs: result.latencyMs,
                        checkedAt: result.checkedAt,
                    });
                } catch {
                    results.push({
                        key: item.key,
                        status: "ERROR",
                        message: "Error interno al verificar",
                        latencyMs: null,
                        checkedAt: new Date().toISOString(),
                    });
                }
                setVerifyProgress(prev => prev ? { ...prev, done: prev.done + 1 } : null);
            }

            // Merge new results into existing health state
            setHealth(prev => prev.map(h => {
                const updated = results.find(r => r.key === h.key);
                return updated ? { ...h, ...updated } : h;
            }));

            const okCount = results.filter(r => r.status === "OK").length;
            const errCount = results.filter(r => r.status === "ERROR").length;
            toast.success(`Re-verificación completada: ${okCount} OK, ${errCount} con error`);
        } catch (e: any) {
            toast.error("Error durante la re-verificación: " + e.message);
        } finally {
            setIsReverifying(false);
            setVerifyProgress(null);
        }
    }, [health]);

    const okCount = health.filter(h => h.status === "OK").length;
    const errorCount = health.filter(h => h.status === "ERROR" || h.status === "DEGRADED").length;
    const unconfigCount = health.filter(h => h.status === "UNCONFIGURED").length;

    const stats = [
        {
            label: "Conectadas",
            val: okCount,
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
            cls: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20"
        },
        {
            label: "Con Errores",
            val: errorCount,
            icon: <XCircle className="w-5 h-5 text-red-400" />,
            cls: "text-red-400",
            bg: "bg-red-500/10 border-red-500/20"
        },
        {
            label: "Sin Configurar",
            val: unconfigCount,
            icon: <AlertCircle className="w-5 h-5 text-slate-500" />,
            cls: "text-slate-400",
            bg: "bg-slate-800 border-slate-700"
        },
    ];

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
                {stats.map((s, i) => (
                    <div
                        key={i}
                        className={`p-4 rounded-xl border ${s.bg} text-center transition-all hover:scale-[1.02]`}
                    >
                        <div className="flex justify-center mb-2">{s.icon}</div>
                        <div className={`text-2xl font-bold ${s.cls}`}>
                            {isLoading ? "—" : s.val}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 uppercase tracking-tighter font-mono">
                            {s.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Re-verify button */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 font-mono">
                    {verifyProgress
                        ? `Verificando ${verifyProgress.done}/${verifyProgress.total}...`
                        : !isLoading && health.length > 0
                            ? `${health.filter(h => h.status !== "UNCONFIGURED").length} integraciones configuradas`
                            : ""
                    }
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={reverifyAll}
                    disabled={isLoading || isReverifying}
                    className="h-7 text-xs text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 gap-1.5"
                >
                    <RefreshCw className={`w-3 h-3 ${isReverifying ? "animate-spin" : ""}`} />
                    {isReverifying ? `Verificando (${verifyProgress?.done ?? 0}/${verifyProgress?.total ?? "?"})` : "Re-verificar todo"}
                </Button>
            </div>
        </div>
    );
}
