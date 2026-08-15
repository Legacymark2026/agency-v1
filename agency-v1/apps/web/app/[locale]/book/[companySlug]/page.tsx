"use client";

import { useState } from "react";
import {
    Calendar as CalendarIcon, Clock, Video, User, Mail, Phone,
    CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Check
} from "lucide-react";

interface Slot {
    time: string;
    iso: string;
}

const AVAILABLE_SLOTS: Slot[] = [
    { time: "09:00 AM", iso: new Date(Date.now() + 86400000 + 3600000 * 9).toISOString() },
    { time: "10:30 AM", iso: new Date(Date.now() + 86400000 + 3600000 * 10.5).toISOString() },
    { time: "02:00 PM", iso: new Date(Date.now() + 86400000 + 3600000 * 14).toISOString() },
    { time: "03:30 PM", iso: new Date(Date.now() + 86400000 + 3600000 * 15.5).toISOString() },
    { time: "05:00 PM", iso: new Date(Date.now() + 86400000 + 3600000 * 17).toISOString() },
];

export default function PublicBookingPage() {
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [notes, setNotes] = useState("");
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleBook = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot || !customerName || !customerEmail) return;

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setIsConfirmed(true);
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
            {/* Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-4xl bg-[#0e131f]/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden relative z-10">
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-mono mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>LEGACYMARK SAS — SISTEMA DE CITAS</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white">Agendar Cita / Demostración</h1>
                        <p className="text-slate-400 text-sm mt-1 flex items-center gap-4 flex-wrap">
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-teal-400" /> 30 Minutos</span>
                            <span className="flex items-center gap-1"><Video className="w-4 h-4 text-purple-400" /> Google Meet</span>
                        </p>
                    </div>
                </div>

                {isConfirmed ? (
                    <div className="p-10 text-center space-y-6 max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                            <Check className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white">¡Cita Confirmada con Éxito!</h2>
                            <p className="text-slate-400 text-sm">
                                Hemos enviado la confirmación y el enlace de videoconferencia de Google Meet a <span className="text-teal-400 font-semibold">{customerEmail}</span>.
                            </p>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-left text-xs space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Cliente:</span>
                                <span className="text-white font-medium">{customerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Horario:</span>
                                <span className="text-teal-400 font-medium">{selectedSlot?.time}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Plataforma:</span>
                                <span className="text-purple-400 font-medium">Google Meet</span>
                            </div>
                        </div>

                        <button
                            onClick={() => { setIsConfirmed(false); setSelectedSlot(null); }}
                            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all cursor-pointer"
                        >
                            Agendar Otra Cita
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12">
                        {/* Selector de Horarios */}
                        <div className="md:col-span-6 p-6 sm:p-8 border-b md:border-b-0 md:border-r border-slate-800/80 space-y-6">
                            <h3 className="text-sm font-mono font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4" />
                                1. Selecciona un Horario Libre
                            </h3>

                            <div className="space-y-2.5">
                                {AVAILABLE_SLOTS.map((slot, i) => {
                                    const isSelected = selectedSlot?.time === slot.time;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                                                isSelected
                                                    ? "bg-teal-500/20 border-teal-500 text-white shadow-lg"
                                                    : "bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Clock className={`w-4 h-4 ${isSelected ? "text-teal-400" : "text-slate-500"}`} />
                                                <span>{slot.time}</span>
                                            </div>
                                            {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Formulario de Confirmación */}
                        <div className="md:col-span-6 p-6 sm:p-8 space-y-6 bg-slate-900/20">
                            <h3 className="text-sm font-mono font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-4 h-4" />
                                2. Completa tus Datos
                            </h3>

                            <form onSubmit={handleBook} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Nombre Completo *</label>
                                    <input
                                        type="text"
                                        required
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Ej. Juan Pérez"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-500 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Correo Electrónico *</label>
                                    <input
                                        type="email"
                                        required
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        placeholder="juan@empresa.com"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-500 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono / WhatsApp</label>
                                    <input
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="+57 300 000 0000"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-500 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Notas / Motivo de la cita</label>
                                    <textarea
                                        rows={2}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Deseo conocer la integración con WhatsApp y los Agentes de IA..."
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-500 text-sm text-white placeholder:text-slate-600 focus:outline-none resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!selectedSlot || loading}
                                    className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
                                >
                                    {loading ? (
                                        <span>Confirmando Reserva...</span>
                                    ) : (
                                        <>
                                            <span>Confirmar y Agendar Cita</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
