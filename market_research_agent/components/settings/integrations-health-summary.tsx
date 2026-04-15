"use client";

import { useState, useEffect, useCallback } from "react";
import { getIntegrationHealthDashboard } from "@/actions/developer";

export function IntegrationsHealthSummary() {
    const [health, setHealth] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const res = await getIntegrationHealthDashboard();
        if (res.success) setHealth(res.data);
        setTimeout(() => setIsLoading(false), 300);
    }, []);

    useEffect(() => { load(); }, [load]);

    const okCount = health.filter(h => h.status === "OK").length;
    const errorCount = health.filter(h => h.status === "ERROR" || h.status === "DEGRADED").length;
    const unconfigCount = health.filter(h => h.status === "UNCONFIGURED").length;

    return (
        <div className="grid grid-cols-3 gap-4">
            {[
                { label: "Conectadas", val: okCount, cls: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                { label: "Con Errores", val: errorCount, cls: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                { label: "Sin Configurar", val: unconfigCount, cls: "text-slate-400", bg: "bg-slate-800 border-slate-700" },
            ].map((s, i) => (
                <div key={i} className={`p-4 rounded-xl border ${s.bg} text-center transition-all hover:scale-[1.02]`}>
                    <div className={`text-2xl font-bold ${s.cls}`}>{isLoading ? "—" : s.val}</div>
                    <div className="text-xs text-slate-500 mt-1 uppercase tracking-tighter font-mono">{s.label}</div>
                </div>
            ))}
        </div>
    );
}
