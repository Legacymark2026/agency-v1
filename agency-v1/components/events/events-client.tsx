"use client";

import { useState, useMemo } from "react";
import { CalendarBoard } from "./CalendarBoard";
import { EventDrawer } from "./EventDrawer";
import { EventFilters } from "./EventFilters";
import { Plus, Download, Printer, Calendar as CalendarIcon, Users, Video, MapPin } from "lucide-react";
import { updateEvent } from "@/actions/events/event-actions";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";

export function EventsClient({ initialEvents }: { initialEvents: any[] }) {
    const [events, setEvents] = useState(initialEvents);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [filters, setFilters] = useState({ type: 'ALL', organizerId: null, query: '' });
    const [prefilledDates, setPrefilledDates] = useState<{ start: Date, end: Date } | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const handleOpenDrawer = (eventId?: string) => {
        setPrefilledDates(null);
        setSelectedEventId(eventId || null);
        setIsDrawerOpen(true);
    };

    const handleDateSelect = (start: Date, end: Date, allDay: boolean) => {
        setPrefilledDates({ start, end });
        setSelectedEventId(null);
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setSelectedEventId(null);
        setPrefilledDates(null);
        setIsDrawerOpen(false);
    };

    const stats = useMemo(() => {
        const upcoming = events.filter(e => new Date(e.startDate) >= new Date()).length;
        const online = events.filter(e => e.type === 'ONLINE').length;
        const physical = events.filter(e => e.type === 'PHYSICAL').length;
        return { total: events.length, upcoming, online, physical };
    }, [events]);

    return (
        <div className="flex-1 flex flex-col h-full relative" style={{ background: '#0B0F19' }}>
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-64 bg-teal-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-80 h-48 bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            {/* ── Header ── */}
            <div
                className="flex-none px-8 py-5 flex items-center justify-between sticky top-0 z-20"
                style={{
                    background: 'rgba(11,15,25,0.95)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(30,41,59,0.7)',
                }}
            >
                <div className="flex items-center gap-4">
                    {/* Teal icon box */}
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.35)' }}
                    >
                        <CalendarIcon className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[9px] text-teal-500/70 uppercase tracking-widest">CAL_MOD · EVENTOS</span>
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                            </span>
                        </div>
                        <h1 className="text-xl font-black text-slate-100 tracking-tight">Calendario de Eventos</h1>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Gestión integral de citas, ferias y reuniones híbridas</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <EventFilters filters={filters} onChange={setFilters} />

                    <div className="w-px h-7 mx-1" style={{ background: 'rgba(30,41,59,0.8)' }} />

                    <button
                        className="p-2.5 rounded-xl transition-all"
                        style={{ color: 'rgba(148,163,184,0.6)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,41,59,0.6)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        title="Exportar a ICS"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        className="p-2.5 rounded-xl transition-all"
                        style={{ color: 'rgba(148,163,184,0.6)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,41,59,0.6)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        title="Imprimir"
                    >
                        <Printer className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => handleOpenDrawer()}
                        className="flex items-center gap-2 px-5 py-2.5 font-bold text-sm text-white rounded-xl shadow-lg transition-all hover:-translate-y-0.5 ml-1"
                        style={{
                            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                            boxShadow: '0 4px 20px rgba(13,148,136,0.3)',
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Evento
                    </button>
                </div>
            </div>

            {/* ── KPI Stats Bar ── */}
            <div
                className="flex-none px-8 py-3 flex items-center gap-3 overflow-x-auto"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.6)', background: 'rgba(15,20,35,0.6)' }}
            >
                <StatCard icon={CalendarIcon} label="Total Eventos" value={stats.total} accent="teal" />
                <StatCard icon={Users} label="Próximos" value={stats.upcoming} accent="emerald" />
                <StatCard icon={Video} label="Online" value={stats.online} accent="blue" />
                <StatCard icon={MapPin} label="Presenciales" value={stats.physical} accent="amber" />
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1 overflow-hidden flex relative">

                {/* Mini Calendar Sidebar */}
                <div
                    className="hidden lg:flex w-72 flex-col overflow-hidden"
                    style={{ borderRight: '1px solid rgba(30,41,59,0.6)', background: 'rgba(11,15,25,0.8)' }}
                >
                    {/* Mini calendar */}
                    <div className="p-4" style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                        <div
                            className="rounded-xl overflow-hidden p-2"
                            style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(30,41,59,0.8)' }}
                        >
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => { if (date) setSelectedDate(date); }}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Upcoming events list */}
                    <div className="p-4 flex-1 overflow-y-auto">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Próximos (Esta Semana)</h3>
                            <span
                                className="font-mono text-[9px] text-teal-400 px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)' }}
                            >
                                {stats.upcoming}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {events
                                .filter(e => new Date(e.startDate) >= new Date() && new Date(e.startDate) <= new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000))
                                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                                .slice(0, 5)
                                .map(e => (
                                    <div
                                        key={e.id}
                                        onClick={() => handleOpenDrawer(e.id)}
                                        className="group p-3 rounded-xl cursor-pointer transition-all"
                                        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.7)' }}
                                        onMouseEnter={ev => { ev.currentTarget.style.borderColor = 'rgba(13,148,136,0.4)'; ev.currentTarget.style.background = 'rgba(13,148,136,0.06)'; }}
                                        onMouseLeave={ev => { ev.currentTarget.style.borderColor = 'rgba(30,41,59,0.7)'; ev.currentTarget.style.background = 'rgba(15,23,42,0.5)'; }}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${e.type === 'ONLINE' ? 'bg-blue-400' : e.type === 'PHYSICAL' ? 'bg-amber-400' : 'bg-purple-400'}`} />
                                            <span className="font-mono text-[9px] text-slate-500 uppercase">
                                                {new Date(e.startDate).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-300 group-hover:text-teal-400 transition-colors line-clamp-2">{e.title}</p>
                                    </div>
                                ))
                            }
                            {stats.upcoming === 0 && (
                                <div
                                    className="text-center p-6 rounded-xl"
                                    style={{ border: '1px dashed rgba(30,41,59,0.7)' }}
                                >
                                    <CalendarIcon className="w-7 h-7 text-slate-700 mx-auto mb-2" />
                                    <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wide">No hay eventos próximos esta semana.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Calendar Board */}
                <div className="flex-1 overflow-hidden relative">
                    <CalendarBoard
                        events={events}
                        filters={filters}
                        selectedDate={selectedDate}
                        onEventClick={(id) => handleOpenDrawer(id)}
                        onEventDropped={async (id, start, end) => {
                            const originalEvent = events.find(e => e.id === id);
                            if (!originalEvent) return;

                            setEvents(prev => prev.map(e => e.id === id ? { ...e, startDate: start, endDate: end || e.endDate } : e));

                            const res = await updateEvent(id, {
                                startDate: start.toISOString(),
                                endDate: end ? end.toISOString() : originalEvent.endDate,
                            });

                            if (res.success) {
                                toast?.success("Horario de evento actualizado");
                            } else {
                                toast?.error(res.error || "Error al actualizar evento");
                                setEvents(prev => prev.map(e => e.id === id ? originalEvent : e));
                            }
                        }}
                        onDateSelect={handleDateSelect}
                    />
                </div>
            </div>

            <EventDrawer
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                eventId={selectedEventId}
                initialEvent={events.find(e => e.id === selectedEventId)}
                prefilledDates={prefilledDates}
                onEventSaved={(newEvent) => {
                    setEvents(prev => {
                        const exists = prev.find(e => e.id === newEvent.id);
                        if (exists) return prev.map(e => e.id === newEvent.id ? newEvent : e);
                        return [...prev, newEvent];
                    });
                }}
                onEventDeleted={(deletedId) => {
                    setEvents(prev => prev.filter(e => e.id !== deletedId));
                    handleCloseDrawer();
                }}
            />
        </div>
    );
}

// ── KPI Stat Card ──────────────────────────────────────────────────────────
const ACCENT_MAP: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    teal: { bg: 'rgba(13,148,136,0.12)', border: 'rgba(13,148,136,0.3)', text: '#99f6e4', icon: 'rgba(13,148,136,0.25)' },
    emerald: { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)', text: '#6ee7b7', icon: 'rgba(16,185,129,0.2)' },
    blue: { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.25)', text: '#93c5fd', icon: 'rgba(59,130,246,0.2)' },
    amber: { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', text: '#fcd34d', icon: 'rgba(245,158,11,0.2)' },
};

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) {
    const a = ACCENT_MAP[accent] || ACCENT_MAP.teal;
    return (
        <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl min-w-[155px]"
            style={{ background: a.bg, border: `1px solid ${a.border}` }}
        >
            <div className="p-2 rounded-lg flex-shrink-0" style={{ background: a.icon }}>
                <Icon className="w-4 h-4" style={{ color: a.text }} />
            </div>
            <div>
                <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.6)' }}>{label}</p>
                <p className="text-lg font-black mt-0.5" style={{ color: a.text }}>{value}</p>
            </div>
        </div>
    );
}
