import { Shield, AlertTriangle, Info, Clock, Monitor, User, Globe, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Log {
    id: string;
    action: string;
    user?: { name: string | null; email: string | null } | null;
    ipAddress: string | null;
    userAgent?: string | null;
    details?: any;
    createdAt: Date;
}

function getActionCategory(action: string): "critical" | "warning" | "success" | "info" {
    const a = action.toUpperCase();
    if (a.includes("ERROR") || a.includes("FAIL") || a.includes("BLOCKED") || a.includes("DENIED")) return "critical";
    if (a.includes("WARN") || a.includes("RESET") || a.includes("FORCED") || a.includes("REVOKE")) return "warning";
    if (a.includes("LOGIN") && !a.includes("FAIL")) return "success";
    return "info";
}

const CATEGORY_STYLES = {
    critical: {
        dot: "bg-red-500",
        icon: <AlertTriangle size={13} />,
        badge: "bg-red-500/10 text-red-400 border-red-500/20",
        row: "border-red-500/10",
    },
    warning: {
        dot: "bg-amber-500",
        icon: <AlertTriangle size={13} />,
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        row: "border-amber-500/10",
    },
    success: {
        dot: "bg-emerald-500",
        icon: <CheckCircle size={13} />,
        badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        row: "",
    },
    info: {
        dot: "bg-blue-500",
        icon: <Info size={13} />,
        badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        row: "",
    },
};

function formatAction(action: string) {
    return action.replace(/_/g, " ").toLowerCase().replace(/^./, c => c.toUpperCase());
}

export function LogsTable({ logs }: { logs: Log[] }) {
    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500">
                <Shield className="h-10 w-10 text-slate-700 mb-3" />
                <p className="text-sm font-medium">No se encontraron registros de actividad.</p>
                <p className="text-xs text-slate-600 mt-1">El sistema comenzará a registrar eventos a partir de la primera actividad.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-slate-800 bg-slate-950/60">
                <span className="col-span-4 text-xs font-mono uppercase tracking-widest text-slate-500">Evento</span>
                <span className="col-span-3 text-xs font-mono uppercase tracking-widest text-slate-500">Usuario</span>
                <span className="col-span-3 text-xs font-mono uppercase tracking-widest text-slate-500">IP / Dispositivo</span>
                <span className="col-span-2 text-xs font-mono uppercase tracking-widest text-slate-500 text-right">Fecha</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-800/60">
                {logs.map((log) => {
                    const category = getActionCategory(log.action);
                    const style = CATEGORY_STYLES[category];

                    return (
                        <div
                            key={log.id}
                            className={`grid grid-cols-12 items-center px-4 py-3 hover:bg-slate-800/30 transition-colors group ${style.row ? `border-l-2 ${style.row}` : ""}`}
                        >
                            {/* Event */}
                            <div className="col-span-4 flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium text-slate-100 truncate">{formatAction(log.action)}</span>
                                    <span className={`text-xs font-mono px-1.5 py-px rounded border w-fit mt-0.5 ${style.badge}`}>
                                        {category.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* User */}
                            <div className="col-span-3 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                                    <User size={11} className="text-slate-400" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-medium text-slate-300 truncate">
                                        {log.user?.name || "Sistema"}
                                    </span>
                                    <span className="text-xs text-slate-600 truncate font-mono">
                                        {log.user?.email || "anonymous@system"}
                                    </span>
                                </div>
                            </div>

                            {/* IP */}
                            <div className="col-span-3 flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                    <Globe size={11} className="text-slate-600 flex-shrink-0" />
                                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                        {log.ipAddress || "—"}
                                    </span>
                                </div>
                                {log.userAgent && (
                                    <span className="text-xs text-slate-600 truncate font-mono max-w-[160px]" title={log.userAgent}>
                                        {log.userAgent.split(" ")[0]}
                                    </span>
                                )}
                            </div>

                            {/* Time */}
                            <div className="col-span-2 flex flex-col items-end gap-1">
                                <span className="text-xs text-slate-400 font-mono">
                                    {format(new Date(log.createdAt), "HH:mm:ss")}
                                </span>
                                <span className="text-xs text-slate-600">
                                    {format(new Date(log.createdAt), "dd MMM yyyy", { locale: es })}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
