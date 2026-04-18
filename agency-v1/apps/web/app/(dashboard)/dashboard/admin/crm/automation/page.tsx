import { prisma } from "@/lib/prisma";
import { listAutomationRules } from "@/actions/crm-automation";
import { Zap, Play, Clock, CheckCircle, XCircle, AlertTriangle, Plus } from "lucide-react";
import { AutomationRuleForm } from "./AutomationRuleForm";

const TRIGGER_LABELS: Record<string, string> = {
    STAGE_STUCK_X_DAYS: "🧊 Stage estancada X días",
    DEAL_CREATED: "✨ Deal creado",
    STAGE_CHANGED: "🔄 Etapa cambiada",
    WON: "🏆 Deal ganado",
    LOST: "❌ Deal perdido",
};

const ACTION_LABELS: Record<string, string> = {
    NOTIFY_ASSIGNEE: "🔔 Notificar vendedor",
    NOTIFY_ADMIN: "📣 Notificar admin",
    CHANGE_PRIORITY: "🚨 Cambiar prioridad",
    MOVE_STAGE: "➡️ Mover a etapa",
    ADD_TAG: "🏷️ Agregar tag",
    SEND_WEBHOOK: "🌐 Enviar webhook",
};

export default async function AutomationPage() {
    const company = await prisma.company.findFirst();
    if (!company) return <div className="ds-page flex items-center justify-center"><p className="font-mono text-xs text-slate-600">Empresa no configurada</p></div>;

    const rules = await listAutomationRules(company.id);

    const stats = {
        total: rules.length,
        active: rules.filter(r => r.isActive).length,
        totalExecutions: rules.reduce((s, r) => s + r.executionCount, 0),
    };

    return (
        <div className="ds-page space-y-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between pb-6" style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <span className="ds-badge ds-badge-teal mb-3 inline-flex">
                        <span className="relative flex h-1.5 w-1.5 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" /></span>
                        CRM_CORE · AUTOMATION
                    </span>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-11 h-11"><Zap className="w-5 h-5 text-teal-400" /></div>
                        <div>
                            <h1 className="ds-heading-page">Motor de Automatización</h1>
                            <p className="ds-subtext mt-1">Reglas automáticas · Ejecutadas cada hora</p>
                        </div>
                    </div>
                </div>
                <AutomationRuleForm companyId={company.id} />
            </div>

            {/* Stats */}
            <div className="relative z-10 grid grid-cols-3 gap-4">
                {[
                    { label: "Reglas Activas", value: stats.active, icon: Play, color: "text-teal-400" },
                    { label: "Total Reglas", value: stats.total, icon: Zap, color: "text-violet-400" },
                    { label: "Ejecuciones Totales", value: stats.totalExecutions, icon: CheckCircle, color: "text-sky-400" },
                ].map(k => (
                    <div key={k.label} className="ds-kpi group">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">{k.label}</p>
                            <div className="ds-icon-box w-7 h-7"><k.icon size={12} strokeWidth={1.5} className={k.color} /></div>
                        </div>
                        <p className="ds-stat-value">{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Cron info */}
            <div className="relative z-10 flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(30,41,59,0.8)' }}>
                <Clock size={14} className="text-teal-400 shrink-0" />
                <p className="font-mono text-xs text-slate-500">
                    El motor de automatización se ejecuta cada hora via <code className="text-teal-400">GET /api/crm/run-automation?secret=CRON_SECRET</code>.
                    Configura tu cron en Vercel, Railway, o cualquier scheduler.
                </p>
            </div>

            {/* Rules List */}
            <div className="relative z-10 space-y-4">
                <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Reglas Configuradas</p>
                {rules.length === 0 ? (
                    <div className="ds-section h-32 flex flex-col items-center justify-center text-center">
                        <Zap size={24} className="text-slate-700 mb-3" />
                        <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">Sin reglas de automatización</p>
                        <p className="font-mono text-xs text-slate-700 mt-1">Crea tu primera regla para automatizar el pipeline</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rules.map(rule => (
                            <div key={rule.id} className="ds-section" style={{ borderColor: rule.isActive ? 'rgba(13,148,136,0.2)' : 'rgba(30,41,59,0.8)' }}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${rule.isActive ? "bg-teal-400 shadow-[0_0_8px_rgba(13,148,136,0.5)]" : "bg-slate-700"}`} />
                                        <div>
                                            <p className="font-mono text-xs font-bold text-slate-200">{rule.name}</p>
                                            {rule.description && <p className="font-mono text-xs text-slate-600 mt-0.5">{rule.description}</p>}
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="font-mono text-xs px-2 py-0.5 rounded-sm text-violet-400" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                                                    SI: {TRIGGER_LABELS[rule.triggerType] ?? rule.triggerType}{rule.triggerDays ? ` (${rule.triggerDays}d)` : ""}
                                                </span>
                                                <span className="text-slate-600 font-mono text-xs">→</span>
                                                <span className="font-mono text-xs px-2 py-0.5 rounded-sm text-sky-400" style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
                                                    {ACTION_LABELS[rule.actionType] ?? rule.actionType}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-mono text-xs text-slate-600">{rule.executionCount} ejecuciones</p>
                                        {rule.lastRunAt && <p className="font-mono text-xs text-slate-700">{new Date(rule.lastRunAt).toLocaleDateString()}</p>}
                                    </div>
                                </div>
                                {rule.logs.length > 0 && (
                                    <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid rgba(30,41,59,0.8)' }}>
                                        {rule.logs.map(log => (
                                            <div key={log.id} className="flex items-center gap-2">
                                                {log.result === "SUCCESS" ? <CheckCircle size={10} className="text-teal-400" /> : <XCircle size={10} className="text-red-400" />}
                                                <p className="font-mono text-xs text-slate-600">{log.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
