"use client";

import { useState } from "react";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { testIntegrationConnection } from "@/actions/developer";
import { saveIntegration } from "@/actions/integrations";
import { toast } from "sonner";

const STATUS_CFG: Record<string, { label: string; icon: React.ReactNode; border: string; bg: string }> = {
    OK: {
        label: "Conectado", border: "border-emerald-500/30", bg: "bg-emerald-500/5",
        icon: <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />,
    },
    DEGRADED: {
        label: "Degradado", border: "border-amber-500/30", bg: "bg-amber-500/5",
        icon: <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />,
    },
    ERROR: {
        label: "Error", border: "border-red-500/30", bg: "bg-red-500/5",
        icon: <span className="w-1.5 h-1.5 rounded-full bg-red-500" />,
    },
    UNCONFIGURED: {
        label: "No configurado", border: "border-slate-700", bg: "bg-slate-950/40",
        icon: <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />,
    },
};

interface NewIntegrationCardProps {
    integration: {
        key: string;
        name: string;
        desc: string;
        logo: string;
        fields: { label: string; placeholder: string }[];
    };
    status?: any;
}

export function NewIntegrationCard({ integration, status }: NewIntegrationCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [testing, setTesting] = useState(false);

    const cfg = STATUS_CFG[status?.status || "UNCONFIGURED"];

    const handleTest = async () => {
        setTesting(true);
        const res = await testIntegrationConnection(integration.key);
        setTesting(false);
        if (res.success) toast.success(`${integration.name}: ${res.message}`);
        else toast.error(`${integration.name}: ${res.error}`);
    };

    const handleSave = async () => {
        try {
            let mappedConfig: any = { ...fieldValues };
            // Resend explicit mapping
            if (integration.key === "RESEND") {
                const val = Object.values(fieldValues)[0];
                if (val) mappedConfig.apiKey = val;
            }
            await saveIntegration(integration.key, mappedConfig);
            toast.success("Configuración guardada exitosamente");
        } catch (e: any) {
            toast.error("Error: " + e.message);
        }
    };

    return (
        <div className={`border ${cfg.border} ${cfg.bg} rounded-xl overflow-hidden transition-all`}>
            <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-800/20 transition-colors"
                onClick={() => setExpanded(v => !v)}
            >
                <span className="text-2xl">{integration.logo}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200">{integration.name}</span>
                        <div className="flex items-center gap-1">
                            {cfg.icon}
                            <span className="text-[10px] text-slate-500">{cfg.label}</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{integration.desc}</p>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
            </div>

            {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-800/60 pt-3">
                    {integration.fields.map((field, i) => (
                        <div key={i}>
                            <label className="text-xs text-slate-400 block mb-1">{field.label}</label>
                            <input
                                type={field.label.toLowerCase().includes("key") || field.label.toLowerCase().includes("token") || field.label.toLowerCase().includes("secret") ? "password" : "text"}
                                placeholder={field.placeholder}
                                value={fieldValues[field.label] || ""}
                                onChange={e => setFieldValues(p => ({ ...p, [field.label]: e.target.value }))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                            />
                        </div>
                    ))}
                    <div className="flex gap-3 justify-end pt-1">
                        <button onClick={handleTest} disabled={testing}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50">
                            <RefreshCw className={`w-3 h-3 ${testing ? "animate-spin" : ""}`} />
                            {testing ? "Probando..." : "Test de Conexión"}
                        </button>
                        <button
                            className="px-3 py-1.5 text-xs bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg transition-colors"
                            onClick={handleSave}
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
