"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Calendar as CalendarIcon, Clock, Video, User, Mail, Phone,
    Plus, CheckCircle2, XCircle, ExternalLink, Sparkles, Copy,
    ChevronRight, Settings, Users, ShieldCheck, Filter, Sliders,
    Save, Edit2, Trash2, X, MessageSquare, AlertCircle, ToggleLeft, ToggleRight
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

interface BookingTypeItem {
    id: string;
    title: string;
    durationMinutes: number;
    bufferMinutes: number;
    type: string;
    color: string;
    desc: string;
    price: number;
    currency: string;
    assignmentStrategy: "ROUND_ROBIN" | "COLLECTIVE" | "SINGLE";
    requiresPayment: boolean;
}

interface DaySchedule {
    day: string;
    enabled: boolean;
    startTime: string;
    endTime: string;
}

const DEFAULT_BOOKING_TYPES: BookingTypeItem[] = [
    {
        id: "bt-1",
        title: "Demostración de Plataforma SaaS",
        durationMinutes: 30,
        bufferMinutes: 10,
        type: "Google Meet",
        color: "border-teal-500/40 text-teal-400 bg-teal-500/10",
        desc: "Presentación interactiva de características y resolución de dudas.",
        price: 0,
        currency: "USD",
        assignmentStrategy: "ROUND_ROBIN",
        requiresPayment: false,
    },
    {
        id: "bt-2",
        title: "Consultoría de IA & Agentes",
        durationMinutes: 60,
        bufferMinutes: 15,
        type: "Google Meet",
        color: "border-purple-500/40 text-purple-400 bg-purple-500/10",
        desc: "Diseño de estrategia de automatización cognitiva y entrenamiento.",
        price: 50,
        currency: "USD",
        assignmentStrategy: "SINGLE",
        requiresPayment: true,
    },
    {
        id: "bt-3",
        title: "Soporte Técnico V.I.P.",
        durationMinutes: 30,
        bufferMinutes: 5,
        type: "Google Meet",
        color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
        desc: "Asistencia directa personalizada para configuración e integraciones.",
        price: 0,
        currency: "USD",
        assignmentStrategy: "ROUND_ROBIN",
        requiresPayment: false,
    },
];

const DEFAULT_SCHEDULE: DaySchedule[] = [
    { day: "Lunes", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Martes", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Miércoles", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Jueves", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Viernes", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Sábado", enabled: false, startTime: "09:00", endTime: "13:00" },
    { day: "Domingo", enabled: false, startTime: "09:00", endTime: "13:00" },
];

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
    const [activeTab, setActiveTab] = useState<"appointments" | "types" | "schedule" | "rules">("appointments");
    const [appointments, setAppointments] = useState<AppointmentItem[]>(DEMO_APPOINTMENTS);
    const [bookingTypes, setBookingTypes] = useState<BookingTypeItem[]>(DEFAULT_BOOKING_TYPES);
    const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
    const [copied, setCopied] = useState(false);
    const [savedMsg, setSavedMsg] = useState(false);

    // Modal state for Booking Type CRUD
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDuration, setNewDuration] = useState(30);
    const [newBuffer, setNewBuffer] = useState(10);
    const [newDesc, setNewDesc] = useState("");
    const [newPrice, setNewPrice] = useState(0);
    const [newStrategy, setNewStrategy] = useState<"ROUND_ROBIN" | "COLLECTIVE" | "SINGLE">("ROUND_ROBIN");
    const [newRequiresPayment, setNewRequiresPayment] = useState(false);

    // Rules state
    const [minNoticeHours, setMinNoticeHours] = useState(2);
    const [maxAdvanceDays, setMaxAdvanceDays] = useState(30);
    const [whatsappReminder, setWhatsappReminder] = useState(
        "Hola {{nombre}}, te recordamos tu cita '{{tipo_cita}}' mañana a las {{hora}}. Enlace: {{link}}"
    );

    const publicUrl = "https://legacymarksas.com/book/legacymark";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCreateType = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle) return;

        const created: BookingTypeItem = {
            id: `bt-${Date.now()}`,
            title: newTitle,
            durationMinutes: newDuration,
            bufferMinutes: newBuffer,
            type: "Google Meet",
            color: "border-teal-500/40 text-teal-400 bg-teal-500/10",
            desc: newDesc || "Servicio de agendamiento personalizado.",
            price: newPrice,
            currency: "USD",
            assignmentStrategy: newStrategy,
            requiresPayment: newRequiresPayment,
        };

        setBookingTypes([...bookingTypes, created]);
        setShowTypeModal(false);
        setNewTitle("");
        setNewDesc("");
        setNewPrice(0);
    };

    const handleDeleteType = (id: string) => {
        if (!confirm("¿Eliminar este tipo de cita?")) return;
        setBookingTypes(bookingTypes.filter((t) => t.id !== id));
    };

    const handleToggleDay = (idx: number) => {
        const next = [...schedule];
        next[idx].enabled = !next[idx].enabled;
        setSchedule(next);
    };

    const handleSaveConfig = () => {
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 2500);
    };

    return (
        <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--ds-border)] pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-[var(--ds-teal-md)] text-xs font-mono mb-2 shadow-[var(--ds-shadow-teal)]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>CONFIGURADOR GLOBAL DE CITAS & AGENDAMIENTO</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <CalendarIcon className="w-8 h-8 text-[var(--ds-teal-md)]" />
                        Agendamiento de Citas
                    </h1>
                    <p className="text-[var(--ds-text-secondary)] text-sm mt-1">
                        Configura horarios de atención por día, tipos de servicios, reglas de buffer y recordatorios por WhatsApp.
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
                        <span>Página Pública</span>
                    </Link>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-[var(--ds-border)] pb-3 overflow-x-auto">
                {[
                    { id: "appointments", label: "Citas Agendadas", icon: <CalendarIcon className="w-4 h-4" /> },
                    { id: "types", label: "Tipos de Cita / Servicios (CRUD)", icon: <Clock className="w-4 h-4" /> },
                    { id: "schedule", label: "Horarios de Atención Semanales", icon: <Sliders className="w-4 h-4" /> },
                    { id: "rules", label: "Reglas & Recordatorios WhatsApp", icon: <MessageSquare className="w-4 h-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                            activeTab === tab.id
                                ? "bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-white shadow-[var(--ds-shadow-teal)]"
                                : "text-[var(--ds-text-secondary)] hover:text-white hover:bg-[var(--ds-surface)]"
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB 1: CITAS AGENDADAS */}
            {activeTab === "appointments" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Citas Agendadas", value: appointments.length, icon: <CalendarIcon className="w-4 h-4 text-teal-400" /> },
                            { label: "Citas Próximas", value: appointments.filter((a) => a.status === "CONFIRMED").length, icon: <Clock className="w-4 h-4 text-purple-400" /> },
                            { label: "Completadas hoy", value: appointments.filter((a) => a.status === "COMPLETED").length, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
                            { label: "Integración de IA", value: "Activa (MCP)", icon: <ShieldCheck className="w-4 h-4 text-sky-400" /> },
                        ].map((kpi, i) => (
                            <div key={i} className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-[var(--ds-text-muted)] font-medium">{kpi.label}</span>
                                    <div className="p-1.5 rounded-lg bg-[var(--ds-surface-2)]">{kpi.icon}</div>
                                </div>
                                <p className="text-2xl font-bold text-[var(--ds-text-primary)]">{kpi.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-[var(--ds-border)]/60">
                            {appointments.map((appt) => {
                                const dateObj = new Date(appt.startTime);
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
                                                    <span>Google Meet</span>
                                                </Link>
                                            )}
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                                Confirmada
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: CONFIGURACIÓN DE TIPOS DE CITA (CRUD) */}
            {activeTab === "types" && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-white">Servicios & Tipos de Cita Ofertados</h3>
                            <p className="text-xs text-[var(--ds-text-muted)] mt-0.5">Define las opciones que los clientes pueden agendar en la página pública.</p>
                        </div>
                        <button
                            onClick={() => setShowTypeModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--ds-teal)] text-black text-xs font-bold hover:bg-[var(--ds-teal-bright)] transition-all cursor-pointer shadow-md"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nuevo Tipo de Cita</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {bookingTypes.map((type) => (
                            <div key={type.id} className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-2xl p-5 hover:border-[var(--ds-border-glow)] transition-all flex flex-col justify-between space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${type.color}`}>
                                            {type.durationMinutes} min (+{type.bufferMinutes}m buffer)
                                        </span>
                                        <button
                                            onClick={() => handleDeleteType(type.id)}
                                            className="text-[var(--ds-text-muted)] hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1">{type.title}</h4>
                                        <p className="text-xs text-[var(--ds-text-muted)] line-clamp-2">{type.desc}</p>
                                    </div>

                                    <div className="pt-2 border-t border-[var(--ds-border)]/50 space-y-1 text-xs text-[var(--ds-text-secondary)] font-mono">
                                        <div className="flex justify-between">
                                            <span>Asignación:</span>
                                            <span className="text-teal-400 font-bold">{type.assignmentStrategy}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Precio:</span>
                                            <span className="text-white font-bold">{type.requiresPayment ? `$${type.price} ${type.currency}` : "Gratis"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 3: HORARIOS DE ATENCIÓN SEMANALES */}
            {activeTab === "schedule" && (
                <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-4">
                        <div>
                            <h3 className="text-base font-bold text-white">Disponibilidad Semanal del Equipo</h3>
                            <p className="text-xs text-[var(--ds-text-muted)] mt-0.5">Define los días laborables y las horas exactas en las que el sistema permitirá reservas.</p>
                        </div>
                        <button
                            onClick={handleSaveConfig}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-black text-xs font-bold hover:bg-teal-400 transition-all cursor-pointer shadow-md"
                        >
                            <Save className="w-4 h-4" />
                            <span>{savedMsg ? "¡Guardado!" : "Guardar Horarios"}</span>
                        </button>
                    </div>

                    <div className="divide-y divide-[var(--ds-border)]/60">
                        {schedule.map((item, idx) => (
                            <div key={item.day} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3 w-32">
                                    <button
                                        onClick={() => handleToggleDay(idx)}
                                        className={`w-5 h-5 rounded flex items-center justify-center border cursor-pointer ${
                                            item.enabled ? "bg-teal-500 border-teal-500 text-black" : "bg-[var(--ds-bg-deep)] border-[var(--ds-border)] text-transparent"
                                        }`}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                    <span className={`text-xs font-bold ${item.enabled ? "text-white" : "text-[var(--ds-text-muted)] line-through"}`}>
                                        {item.day}
                                    </span>
                                </div>

                                {item.enabled ? (
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="time"
                                            value={item.startTime}
                                            onChange={(e) => {
                                                const next = [...schedule];
                                                next[idx].startTime = e.target.value;
                                                setSchedule(next);
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white font-mono focus:outline-none"
                                        />
                                        <span className="text-xs text-[var(--ds-text-muted)]">a</span>
                                        <input
                                            type="time"
                                            value={item.endTime}
                                            onChange={(e) => {
                                                const next = [...schedule];
                                                next[idx].endTime = e.target.value;
                                                setSchedule(next);
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white font-mono focus:outline-none"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-xs text-[var(--ds-text-muted)] font-mono italic">No disponible (Cerrado)</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 4: REGLAS & RECORDATORIOS WHATSAPP */}
            {activeTab === "rules" && (
                <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-4">
                        <div>
                            <h3 className="text-base font-bold text-white">Reglas de Reserva & Plantillas WhatsApp</h3>
                            <p className="text-xs text-[var(--ds-text-muted)] mt-0.5">Parámetros de anticipación y textos automáticos de confirmación.</p>
                        </div>
                        <button
                            onClick={handleSaveConfig}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                        >
                            <Save className="w-4 h-4" />
                            <span>{savedMsg ? "¡Guardado!" : "Guardar Reglas"}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-white">Antelación Mínima para Reservar (Horas)</label>
                            <input
                                type="number"
                                value={minNoticeHours}
                                onChange={(e) => setMinNoticeHours(Number(e.target.value))}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white font-mono focus:outline-none"
                            />
                            <p className="text-[10px] text-[var(--ds-text-muted)]">Evita que los clientes agenden citas con menos de X horas de aviso.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-white">Antelación Máxima para Reservar (Días)</label>
                            <input
                                type="number"
                                value={maxAdvanceDays}
                                onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white font-mono focus:outline-none"
                            />
                            <p className="text-[10px] text-[var(--ds-text-muted)]">Límite de días hacia el futuro en el que los usuarios pueden agendar.</p>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[var(--ds-border)]">
                        <label className="text-xs font-semibold text-white">Plantilla de Recordatorio por WhatsApp (24 Horas Antes)</label>
                        <textarea
                            rows={3}
                            value={whatsappReminder}
                            onChange={(e) => setWhatsappReminder(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white font-mono focus:outline-none resize-none"
                        />
                        <p className="text-[10px] text-[var(--ds-text-muted)]">Variables disponibles: <code className="text-purple-400 font-bold">&#123;&#123;nombre&#125;&#125;</code>, <code className="text-purple-400 font-bold">&#123;&#123;tipo_cita&#125;&#125;</code>, <code className="text-purple-400 font-bold">&#123;&#123;hora&#125;&#125;</code>, <code className="text-purple-400 font-bold">&#123;&#123;link&#125;&#125;</code></p>
                    </div>
                </div>
            )}

            {/* Modal para Crear Tipo de Cita */}
            {showTypeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Plus className="w-4 h-4 text-teal-400" /> Nuevo Tipo de Cita / Servicio
                            </h3>
                            <button onClick={() => setShowTypeModal(false)} className="text-[var(--ds-text-muted)] hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateType} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-white mb-1">Nombre del Servicio *</label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Ej. Sesión de Consultoría VIP"
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-white mb-1">Duración (Minutos)</label>
                                    <select
                                        value={newDuration}
                                        onChange={(e) => setNewDuration(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white focus:outline-none"
                                    >
                                        <option value={15}>15 Minutos</option>
                                        <option value={30}>30 Minutos</option>
                                        <option value={45}>45 Minutos</option>
                                        <option value={60}>60 Minutos (1 Hora)</option>
                                        <option value={90}>90 Minutos</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-white mb-1">Buffer / Colchón (Min)</label>
                                    <select
                                        value={newBuffer}
                                        onChange={(e) => setNewBuffer(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white focus:outline-none"
                                    >
                                        <option value={5}>5 Minutos</option>
                                        <option value={10}>10 Minutos</option>
                                        <option value={15}>15 Minutos</option>
                                        <option value={30}>30 Minutos</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-white mb-1">Descripción del Servicio</label>
                                <textarea
                                    rows={2}
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="Breve explicación para los clientes..."
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white focus:outline-none resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTypeModal(false)}
                                    className="px-4 py-2 rounded-xl bg-[var(--ds-surface-2)] text-xs text-[var(--ds-text-secondary)] hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs shadow-md"
                                >
                                    Guardar Servicio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
