"use client";

import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, MapPin, Video, Users, Clock, AlertCircle, Trash2, Sparkles } from "lucide-react";
import { createEvent, updateEvent, deleteEvent } from "@/actions/events/event-actions";
import { toast } from "sonner";
import { LeadSelector } from "./LeadSelector";
import { DealSelector } from "./DealSelector";

interface EventDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string | null;
    initialEvent?: any;
    prefilledDates?: { start: Date; end: Date } | null;
    onEventSaved: (event: any) => void;
    onEventDeleted?: (id: string) => void;
}

export function EventDrawer({ isOpen, onClose, eventId, initialEvent, prefilledDates, onEventSaved, onEventDeleted }: EventDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [generatingAgenda, setGeneratingAgenda] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
    const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

    // Initial State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "ONLINE" as "ONLINE" | "PHYSICAL" | "HYBRID",
        startDate: "",
        startTime: "09:00",
        endDate: "",
        endTime: "10:00",
        isAllDay: false,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        recurrenceRule: "",
        // PHYSICAL Meta
        address: "",
        city: "",
        capacity: "",
        // ONLINE Meta
        platform: "Zoom",
        meetingUrl: "",
        meetingId: "",
        passcode: "",
    });

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            setErrorMessage("");
            if (eventId && initialEvent) {
                // Populate event details if Editing
                const start = new Date(initialEvent.startDate);
                const end = new Date(initialEvent.endDate);

                // Format safely
                const formatDate = (d: Date) => d.toISOString().split('T')[0];
                const formatTime = (d: Date) => d.toTimeString().split(' ')[0].substring(0, 5);

                setFormData({
                    title: initialEvent.title || "",
                    description: initialEvent.description || "",
                    type: initialEvent.type || "ONLINE",
                    startDate: formatDate(start),
                    startTime: formatTime(start),
                    endDate: formatDate(end),
                    endTime: formatTime(end),
                    isAllDay: initialEvent.isAllDay || false,
                    timeZone: initialEvent.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                    recurrenceRule: initialEvent.recurrenceRule || "",
                    address: initialEvent.metadata?.address || "",
                    city: initialEvent.metadata?.city || "",
                    capacity: initialEvent.metadata?.capacity || "",
                    platform: initialEvent.metadata?.platform || "Zoom",
                    meetingUrl: initialEvent.metadata?.meetingUrl || "",
                    meetingId: initialEvent.metadata?.meetingId || "",
                    passcode: initialEvent.metadata?.passcode || "",
                });

                const participantIds = initialEvent.participants
                    ? initialEvent.participants.map((p: any) => p.leadId).filter(Boolean)
                    : [];
                setSelectedLeadIds(participantIds);
                setSelectedDealId(initialEvent.dealId || null);
            } else {
                // Reset form for New Event
                let startStr, endTimeStr, endStr;
                let startTimeStr = "09:00";

                if (prefilledDates) {
                    const start = prefilledDates.start;
                    const end = prefilledDates.end;

                    startStr = start.toISOString().split('T')[0];
                    endStr = end.toISOString().split('T')[0];

                    startTimeStr = start.toTimeString().split(' ')[0].substring(0, 5);
                    endTimeStr = end.toTimeString().split(' ')[0].substring(0, 5);
                } else {
                    const d = new Date();
                    startStr = d.toISOString().split('T')[0];

                    d.setHours(d.getHours() + 1);
                    endStr = d.toISOString().split('T')[0];
                    endTimeStr = d.toTimeString().split(' ')[0].substring(0, 5);
                }

                setFormData(prev => ({
                    ...prev,
                    title: "", description: "",
                    startDate: startStr, endDate: endStr,
                    startTime: startTimeStr, endTime: endTimeStr,
                    address: "", city: "", meetingUrl: "", meetingId: "", recurrenceRule: ""
                }));
                setSelectedLeadIds([]);
                setSelectedDealId(null);
            }
        }
    }, [isOpen, eventId, initialEvent, prefilledDates]);

    if (!isOpen) return null;

    const handleGenerateAgenda = async () => {
        if (!formData.title) {
            toast?.error("Por favor ingresa un título primero.");
            return;
        }
        setGeneratingAgenda(true);
        // Simulate API call for AI generation
        setTimeout(() => {
            const agenda = `### Agenda Propuesta: ${formData.title}\n\n1. Bienvenida y contexto (5 min)\n2. Revisión del estado actual (15 min)\n3. Discusión de puntos clave (20 min)\n4. Acuerdos y próximos pasos (10 min)\n\n*Nota: Agenda generada automáticamente.*`;
            setFormData(prev => ({ ...prev, description: agenda }));
            setGeneratingAgenda(false);
            toast?.success("Agenda generada.");
        }, 1200);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");

        // Construct Date Objects
        const start = new Date(`${formData.startDate}T${formData.startTime}:00`);
        const end = new Date(`${formData.endDate}T${formData.endTime}:00`);

        // Construct Metadata Payload dynamically
        let metadata: any = {};
        if (formData.type === "PHYSICAL" || formData.type === "HYBRID") {
            metadata.address = formData.address;
            metadata.city = formData.city;
            metadata.capacity = formData.capacity ? parseInt(formData.capacity) : null;
        }
        if (formData.type === "ONLINE" || formData.type === "HYBRID") {
            metadata.platform = formData.platform;
            metadata.meetingUrl = formData.meetingUrl;
            metadata.meetingId = formData.meetingId;
            metadata.passcode = formData.passcode;
        }

        const payload = {
            title: formData.title,
            description: formData.description,
            type: formData.type,
            startDate: start,
            endDate: end,
            isAllDay: formData.isAllDay,
            timeZone: formData.timeZone,
            recurrenceRule: formData.recurrenceRule || undefined,
            metadata,
            dealId: selectedDealId,
            participants: selectedLeadIds.map(id => ({ leadId: id }))
        };

        const res = eventId
            ? await updateEvent(eventId, payload)
            : await createEvent(payload);

        setLoading(false);

        if (res.success) {
            toast?.success(eventId ? "Evento actualizado" : "Evento creado");
            onEventSaved(res.event);
            onClose();
        } else {
            setErrorMessage(res.error || "Ocurrió un error al guardar el evento");
            toast?.error("Error de conflicto o permisos");
        }
    };

    const handleDelete = async () => {
        if (!eventId || !confirm("¿Estás seguro de que quieres eliminar este evento?")) return;
        setLoading(true);
        const res = await deleteEvent(eventId);
        setLoading(false);
        if (res.success) {
            toast?.success("Evento eliminado");
            onEventDeleted?.(eventId);
        } else {
            setErrorMessage(res.error || "Ocurrió un error al eliminar el evento");
            toast?.error("Error al eliminar");
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
                onClick={() => !loading && onClose()}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-slate-100">
                <div className="flex-none p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                            {eventId ? "Editar Evento" : "Nuevo Evento"}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">Configuración de parámetros y logística</p>
                    </div>
                    <button onClick={onClose} disabled={loading} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shadow-sm border border-slate-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    <form id="event-form" onSubmit={handleSubmit} className="space-y-6">

                        {errorMessage && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="text-sm font-medium">{errorMessage}</div>
                            </div>
                        )}

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Título del Evento *</label>
                                <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm text-slate-900 font-medium" placeholder="Ej. Lanzamiento Q3" />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Descripción / Agenda</label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateAgenda}
                                        disabled={generatingAgenda || !formData.title}
                                        className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                    >
                                        {generatingAgenda ? <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        Generar con IA
                                    </button>
                                </div>
                                <textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm text-slate-900 resize-none" placeholder="Agenda o notas adicionales..." />
                            </div>
                        </div>

                        {/* Type Toggle */}
                        <div className="pt-2">
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Modalidad del Evento</label>
                            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                                {["ONLINE", "PHYSICAL", "HYBRID"].map(type => (
                                    <button
                                        key={type} type="button"
                                        onClick={() => setFormData({ ...formData, type: type as any })}
                                        className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex justify-center items-center gap-1.5 ${formData.type === type ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                    >
                                        {type === "ONLINE" && <Video className="w-3.5 h-3.5" />}
                                        {type === "PHYSICAL" && <MapPin className="w-3.5 h-3.5" />}
                                        {type === "HYBRID" && <Users className="w-3.5 h-3.5" />}
                                        {type === "PHYSICAL" ? "FISICO" : type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CRM Leads Selection */}
                        <div className="pt-2">
                            <LeadSelector
                                selectedLeadIds={selectedLeadIds}
                                onChange={setSelectedLeadIds}
                            />
                        </div>

                        {/* CRM Deal Selection */}
                        <div className="pt-2">
                            <DealSelector
                                selectedDealId={selectedDealId}
                                onChange={setSelectedDealId}
                            />
                        </div>

                        {/* Timing */}
                        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <h3 className="text-sm font-bold text-slate-800">Horario</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Fecha Inicio</label>
                                    <input type="date" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Hora Inicio</label>
                                    <input type="time" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Fecha Fin</label>
                                    <input type="date" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Hora Fin</label>
                                    <input type="time" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900" />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 pt-2 cursor-pointer">
                                <input type="checkbox" checked={formData.isAllDay} onChange={e => setFormData({ ...formData, isAllDay: e.target.checked })} className="rounded text-teal-500 focus:ring-teal-500" />
                                <span className="text-xs font-bold text-slate-600">Evento de todo el día</span>
                            </label>

                            <div className="pt-2 border-t border-slate-100">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Repetición</label>
                                <select
                                    value={formData.recurrenceRule}
                                    onChange={(e) => setFormData({ ...formData, recurrenceRule: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm text-slate-900 font-medium"
                                >
                                    <option value="">No repetir</option>
                                    <option value="FREQ=DAILY">Diariamente</option>
                                    <option value="FREQ=WEEKLY">Semanalmente</option>
                                    <option value="FREQ=MONTHLY">Mensualmente</option>
                                </select>
                            </div>
                        </div>

                        {/* Conditional Metadata: ONLINE */}
                        {(formData.type === "ONLINE" || formData.type === "HYBRID") && (
                            <div className="space-y-4 pt-2">
                                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                    <Video className="w-4 h-4 text-blue-500" />
                                    Acceso Virtual
                                </h3>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Enlace de Reunión (URL)</label>
                                    <input type="url" value={formData.meetingUrl} onChange={e => setFormData({ ...formData, meetingUrl: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" placeholder="https://zoom.us/j/..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">ID Reunión</label>
                                        <input value={formData.meetingId} onChange={e => setFormData({ ...formData, meetingId: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" placeholder="Opcional" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Código / Key</label>
                                        <input value={formData.passcode} onChange={e => setFormData({ ...formData, passcode: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" placeholder="Opcional" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Conditional Metadata: PHYSICAL */}
                        {(formData.type === "PHYSICAL" || formData.type === "HYBRID") && (
                            <div className="space-y-4 pt-2">
                                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-orange-500" />
                                    Ubicación Física
                                </h3>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Dirección Exacta</label>
                                    <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" placeholder="Centro de Convenciones..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Ciudad</label>
                                        <input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" placeholder="Madrid, MX..." />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Aforo Máximo</label>
                                        <input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" placeholder="Ej. 150" />
                                    </div>
                                </div>
                            </div>
                        )}

                    </form>
                </div>

                <div className="flex-none p-6 border-t border-slate-100 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {eventId && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="p-3 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                title="Eliminar Evento"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button type="button" onClick={onClose} disabled={loading} className="py-3 px-6 text-slate-500 hover:text-slate-800 font-bold transition-colors">
                            Cancelar
                        </button>
                    </div>
                    <button
                        type="submit"
                        form="event-form"
                        disabled={loading}
                        className="py-3 px-8 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {eventId ? "Actualizar" : "Guardar Evento"}
                    </button>
                </div>
            </div>
        </>
    );
}
