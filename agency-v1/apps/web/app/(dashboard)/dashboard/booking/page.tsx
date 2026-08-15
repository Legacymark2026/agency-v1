"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Calendar as CalendarIcon, Clock, Video, User, Mail, Phone,
    Plus, CheckCircle2, XCircle, ExternalLink, Sparkles, Copy,
    ChevronRight, Settings, Users, ShieldCheck, Filter
} from "lucide-react";

interface AppointmentItem {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    typeName: string;
    durationMinutes: number;
    startTime: string;
    meetingUrl: string;
    status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
    color: string;
}

const DEMO_APPOINTMENTS: AppointmentItem[] = [
    {
        id: "apt-1",
        customerName: "Carlos Mendoza",
        customerEmail: "cmendoza@techcorp.com",
        customerPhone: "+57 300 123 4567",
        typeName: "Demostración de Plataforma SaaS",
        durationMinutes: 30,
        startTime: new Date(Date.now() + 3600000 * 2).toISOString(),
        meetingUrl: "https://meet.google.com/abc-defg-hij",
        status: "CONFIRMED",
        color: "border-teal-500 text-teal-400 bg-teal-500/10",
    },
    {
        id: "apt-2",
        customerName: "Mariana Silva",
        customerEmail: "msilva@agenciaglobal.io",
        customerPhone: "+57 315 987 6543",
        typeName: "Consultoría de IA & Agentes",
        durationMinutes: 60,
        startTime: new Date(Date.now() + 3600000 * 26).toISOString(),
        meetingUrl: "https://meet.google.com/xyz-uvwx-rst",
        status: "CONFIRMED",
        color: "border-purple-500 text-purple-400 bg-purple-500/10",
    },
    {
        id: "apt-3",
        customerName: "Roberto Gómez",
        customerEmail: "roberto@empresa.com",
        customerPhone: "+57 311 555 1234",
        typeName: "Soporte Técnico V.I.P.",
        durationMinutes: 30,
        startTime: new Date(Date.now() - 3600000 * 5).toISOString(),
        meetingUrl: "https://meet.google.com/qwe-rtyu-iop",
        status: "COMPLETED",
        color: "border-emerald-500 text-emerald-400 bg-emerald-500/10",
    },
];

export default function BookingDashboardPage() {
    const [appointments, setAppointments] = useState<AppointmentItem[]>(DEMO_APPOINTMENTS);
    const [copied, setCopied] = useState(false);

    const publicUrl = "https://legacymarksas.com/book/legacymark";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--ds-border)] pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-[var(--ds-teal-md)] text-xs font-mono mb-2 shadow-[var(--ds-shadow-teal)]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>MICROSERVICIO DE AGENDAMIENTO & CITAS</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <CalendarIcon className="w-8 h-8 text-[var(--ds-teal-md)]" />
                        Agendamiento de Citas
                    </h1>
                    <p className="text-[var(--ds-text-secondary)] text-sm mt-1">
                        Gestiona reservas, horarios de atención del equipo y enlaces de agendamiento público sincronizados con IA.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-border-glow)] text-xs font-medium text-white transition-all cursor-pointer"
                    >
                        <Copy className="w-4 h-4 text-[var(--ds-teal-md)]" />
                        <span>{copied ? "¡Enlace Copiado!" : "Copiar Link Público"}</span>
                    </button>
                    <Link
                        href="/book/legacymark"
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--ds-teal)] hover:bg-[var(--ds-teal-bright)] text-xs font-bold text-black transition-all shadow-[var(--ds-shadow-teal)]"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span>Ver Página Pública</span>
                    </Link>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Citas Agendadas", value: appointments.length, icon: <CalendarIcon className="w-4 h-4 text-teal-400" /> },
                    { label: "Citas Próximas", value: appointments.filter(a => a.status === "CONFIRMED").length, icon: <Clock className="w-4 h-4 text-purple-400" /> },
                    { label: "Completadas hoy", value: appointments.filter(a => a.status === "COMPLETED").length, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
                    { label: "Integración de IA", value: "Activa (MCP)", icon: <ShieldCheck className="w-4 h-4 text-sky-400" /> },
                ].map((kpi, i) => (
                    <div key={i} className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl p-4 transition-all duration-300 hover:border-[var(--ds-border-glow)] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[var(--ds-text-muted)] font-medium">{kpi.label}</span>
                            <div className="p-1.5 rounded-lg bg-[var(--ds-surface-2)]">{kpi.icon}</div>
                        </div>
                        <p className="text-2xl font-bold text-[var(--ds-text-primary)]">{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Tipos de Cita Activos */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[var(--ds-teal-md)]" />
                        Tipos de Cita / Servicios Ofertados
                    </h3>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-[var(--ds-teal-md)] text-xs font-semibold hover:bg-[var(--ds-surface-2)] transition-all cursor-pointer">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nuevo Tipo de Cita</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { title: "Demostración de Plataforma SaaS", time: "30 min", type: "Google Meet", color: "border-teal-500/40 text-teal-400 bg-teal-500/10", desc: "Presentación interactiva de características y resolución de dudas." },
                        { title: "Consultoría de IA & Agentes", time: "60 min", type: "Google Meet", color: "border-purple-500/40 text-purple-400 bg-purple-500/10", desc: "Diseño de estrategia de automatización cognitiva y entrenamiento." },
                        { title: "Soporte Técnico V.I.P.", time: "30 min", type: "Google Meet", color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10", desc: "Asistencia directa personalizada para configuración e integraciones." },
                    ].map((type, idx) => (
                        <div key={idx} className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl p-5 hover:border-[var(--ds-border-glow)] transition-all flex flex-col justify-between space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${type.color}`}>
                                        {type.time}
                                    </span>
                                    <span className="text-xs text-[var(--ds-text-muted)]">{type.type}</span>
                                </div>
                                <h4 className="text-sm font-bold text-white mb-1">{type.title}</h4>
                                <p className="text-xs text-[var(--ds-text-muted)] line-clamp-2">{type.desc}</p>
                            </div>
                            <div className="pt-2 border-t border-[var(--ds-border)]/50 flex items-center justify-between text-xs text-[var(--ds-teal-md)]">
                                <span>Configurar Disponibilidad</span>
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Citas Agendadas */}
            <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-purple-400" />
                    Citas y Reservas Registradas
                </h3>

                <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-[var(--ds-border)]/60">
                        {appointments.map((appt) => {
                            const dateObj = new Date(appt.startTime);
                            const formattedDate = dateObj.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
                            const formattedTime = dateObj.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

                            return (
                                <div key={appt.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--ds-surface-2)]/40 transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] rounded-xl text-center shrink-0 min-w-[70px]">
                                            <span className="block text-[10px] font-mono uppercase text-[var(--ds-teal-md)] font-bold">{dateObj.toLocaleDateString("es-CO", { month: "short" })}</span>
                                            <span className="block text-xl font-black text-white">{dateObj.getDate()}</span>
                                            <span className="block text-[10px] text-[var(--ds-text-muted)]">{formattedTime}</span>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-sm font-bold text-white">{appt.customerName}</h4>
                                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${appt.color}`}>
                                                    {appt.typeName}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-[var(--ds-text-muted)] flex-wrap pt-1">
                                                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {appt.customerEmail}</span>
                                                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {appt.customerPhone}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        {appt.meetingUrl && (
                                            <Link
                                                href={appt.meetingUrl}
                                                target="_blank"
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-all"
                                            >
                                                <Video className="w-3.5 h-3.5" />
                                                <span>Unirse a Google Meet</span>
                                            </Link>
                                        )}

                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                            appt.status === "CONFIRMED"
                                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                                : appt.status === "COMPLETED"
                                                ? "bg-blue-500/10 border border-blue-500/30 text-blue-400"
                                                : "bg-red-500/10 border border-red-500/30 text-red-400"
                                        }`}>
                                            {appt.status === "CONFIRMED" ? "Confirmada" : appt.status === "COMPLETED" ? "Completada" : "Cancelada"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
