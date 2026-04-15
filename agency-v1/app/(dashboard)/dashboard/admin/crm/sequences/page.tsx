import { prisma } from "@/lib/prisma";
import { listEmailSequences } from "@/actions/crm-sequences";
import { Mail, Play, Users, CheckCircle, Pause, Plus, ArrowRight, Clock } from "lucide-react";
import { SequenceFormClient } from "./SequenceFormClient";

export default async function SequencesPage() {
    const company = await prisma.company.findFirst();
    if (!company) return <div className="ds-page flex items-center justify-center"><p className="font-mono text-[9px] text-slate-600">Empresa no configurada</p></div>;

    const sequences = await listEmailSequences(company.id);

    const stats = {
        total: sequences.length,
        active: sequences.filter(s => s.isActive).length,
        enrolled: sequences.reduce((sum, s) => sum + s.enrollments.length, 0),
        completed: sequences.reduce((sum, s) => sum + s.enrollments.filter(e => e.status === "COMPLETED").length, 0),
    };

    return (
        <div className="ds-page space-y-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between pb-6" style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <span className="ds-badge ds-badge-teal mb-3 inline-flex">
                        <span className="relative flex h-1.5 w-1.5 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" /></span>
                        CRM_CORE · EMAIL SEQUENCES
                    </span>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-11 h-11"><Mail className="w-5 h-5 text-teal-400" /></div>
                        <div>
                            <h1 className="ds-heading-page">Secuencias de Email</h1>
                            <p className="ds-subtext mt-1">Nurturing automático · Activadas por etapa del deal</p>
                        </div>
                    </div>
                </div>
                <SequenceFormClient companyId={company.id} />
            </div>

            {/* Stats */}
            <div className="relative z-10 grid grid-cols-4 gap-4">
                {[
                    { label: "Secuencias", value: stats.total, icon: Mail, color: "text-teal-400" },
                    { label: "Activas", value: stats.active, icon: Play, color: "text-emerald-400" },
                    { label: "Enrollados", value: stats.enrolled, icon: Users, color: "text-sky-400" },
                    { label: "Completados", value: stats.completed, icon: CheckCircle, color: "text-violet-400" },
                ].map(k => (
                    <div key={k.label} className="ds-kpi group">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em]">{k.label}</p>
                            <div className="ds-icon-box w-7 h-7"><k.icon size={12} strokeWidth={1.5} className={k.color} /></div>
                        </div>
                        <p className="ds-stat-value">{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Sequences List */}
            <div className="relative z-10 space-y-4">
                <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em]">Secuencias Configuradas</p>
                {sequences.length === 0 ? (
                    <div className="ds-section h-36 flex flex-col items-center justify-center text-center">
                        <Mail size={24} className="text-slate-700 mb-3" />
                        <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">Sin secuencias de email</p>
                        <p className="font-mono text-[8px] text-slate-700 mt-1">Crea una secuencia para automatizar el nurturing de tus deals</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sequences.map(seq => {
                            const steps = seq.steps as any[];
                            const activeEnrollments = seq.enrollments.filter(e => e.status === "ACTIVE").length;
                            return (
                                <div key={seq.id} className="ds-section" style={{ borderColor: seq.isActive ? 'rgba(13,148,136,0.2)' : undefined }}>
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${seq.isActive ? 'bg-teal-400 shadow-[0_0_8px_rgba(13,148,136,0.5)]' : 'bg-slate-700'}`} />
                                            <div>
                                                <p className="font-mono text-[11px] font-bold text-slate-200">{seq.name}</p>
                                                {seq.description && <p className="font-mono text-[9px] text-slate-600">{seq.description}</p>}
                                                {seq.triggerStage && (
                                                    <span className="inline-flex mt-1 font-mono text-[9px] px-2 py-0.5 rounded-sm text-sky-400" style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
                                                        ▶ Activada en: {seq.triggerStage}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-mono text-[9px] text-slate-400">{activeEnrollments} activos</p>
                                            <p className="font-mono text-[8px] text-slate-600">{steps.length} pasos</p>
                                        </div>
                                    </div>
                                    {/* Steps visual */}
                                    {steps.length > 0 && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {steps.map((step: any, i: number) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(30,41,59,0.9)' }}>
                                                        <Clock size={9} className="text-slate-500" />
                                                        <span className="font-mono text-[9px] text-slate-400">+{step.delayDays}d</span>
                                                        <Mail size={9} className="text-teal-500 ml-1" />
                                                        <span className="font-mono text-[9px] text-slate-300 max-w-[120px] truncate">{step.subject ?? step.taskTitle ?? "Paso"}</span>
                                                    </div>
                                                    {i < steps.length - 1 && <ArrowRight size={12} className="text-slate-700 shrink-0" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
