import Link from "next/link";
import { Clock, ShieldCheck, Mail, ArrowRight } from "lucide-react";

/**
 * /auth/pending-approval
 * Página mostrada a usuarios con rol GUEST después del registro.
 * Sin acceso al dashboard hasta que el SuperAdmin asigne un rol.
 */
export default function PendingApprovalPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative"
            style={{ background: '#020617' }}>

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none mix-blend-screen" />

            {/* Radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(13,148,136,0.05)_0%,transparent_70%)] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                {/* Top accent line */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-teal-500/50 to-transparent mb-8" />

                {/* Card */}
                <div className="p-8 relative overflow-hidden"
                    style={{
                        background: 'rgba(15,23,42,0.8)',
                        border: '1px solid rgba(30,41,59,0.9)',
                        borderRadius: '0.15rem',
                    }}>

                    {/* Radial glow inside card */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(ellipse_at_top_right,rgba(13,148,136,0.08),transparent_70%)] pointer-events-none" />

                    {/* Header */}
                    <div className="relative z-10 mb-8">
                        <span className="inline-flex items-center gap-2 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-teal-400 mb-6"
                            style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: '0.15rem' }}>
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                            </span>
                            ACCESO PENDIENTE
                        </span>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 flex items-center justify-center relative"
                                style={{
                                    background: 'rgba(245,158,11,0.1)',
                                    border: '1px solid rgba(245,158,11,0.3)',
                                    borderRadius: '0.15rem',
                                }}>
                                <Clock className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight text-slate-100">Cuenta en revisión</h1>
                                <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">Pendiente de autorización</p>
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="relative z-10 space-y-5 mb-8">
                        <div className="ds-card-sm flex items-start gap-3">
                            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[13px] font-bold text-slate-200 mb-1">Cuenta creada exitosamente</p>
                                <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest leading-relaxed">
                                    Tu cuenta fue registrada. El super administrador debe asignarte un rol para activar el acceso al panel de control.
                                </p>
                            </div>
                        </div>

                        <div className="ds-card-sm flex items-start gap-3">
                            <Mail className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[13px] font-bold text-slate-200 mb-1">Serás notificado</p>
                                <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest leading-relaxed">
                                    Recibirás acceso una vez que el administrador apruebe tu cuenta. Puedes intentar iniciar sesión nuevamente después.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Steps indicator */}
                    <div className="relative z-10 mb-8">
                        <p className="font-mono text-[8px] text-slate-700 uppercase tracking-widest mb-3">Proceso de activación</p>
                        <div className="space-y-2">
                            {[
                                { step: 1, label: "Cuenta creada", done: true },
                                { step: 2, label: "Revisión del administrador", done: false },
                                { step: 3, label: "Rol asignado → Acceso activo", done: false },
                            ].map(s => (
                                <div key={s.step} className="flex items-center gap-3">
                                    <div className={`w-5 h-5 flex items-center justify-center font-mono text-[8px] font-bold rounded-sm shrink-0 ${s.done ? 'text-teal-400' : 'text-slate-700'}`}
                                        style={{ background: s.done ? 'rgba(13,148,136,0.15)' : 'rgba(30,41,59,0.6)', border: `1px solid ${s.done ? 'rgba(13,148,136,0.4)' : 'rgba(30,41,59,0.8)'}` }}>
                                        {s.done ? '✓' : s.step}
                                    </div>
                                    <p className={`font-mono text-[9px] uppercase tracking-widest ${s.done ? 'text-teal-400' : 'text-slate-600'}`}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <Link href="/auth/login"
                        className="relative z-10 w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-teal-400 transition-all rounded-sm"
                        style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(30,41,59,0.8)' }}>
                        Volver al login <ArrowRight size={11} />
                    </Link>
                </div>

                {/* Bottom mono label */}
                <p className="text-center font-mono text-[8px] text-slate-800 uppercase tracking-widest mt-6">
                    LegacyMark · Sistema de Control de Acceso · v3.0
                </p>
            </div>
        </div>
    );
}
