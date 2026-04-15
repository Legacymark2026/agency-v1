"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Video, MapPin, Plus, Clock } from "lucide-react";
import { EventDrawer } from "@/components/events/EventDrawer";

interface LeadEventsWidgetProps { leadId: string; initialEvents: any[] }

export function LeadEventsWidget({ leadId, initialEvents }: LeadEventsWidgetProps) {
    const [events, setEvents] = useState(initialEvents);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleEventSaved = (newEvent: any) => {
        setEvents(prev => {
            const exists = prev.find(e => e.id === newEvent.id);
            if (exists) return prev.map(e => e.id === newEvent.id ? newEvent : e);
            return [...prev, newEvent].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        });
    };

    return (
        <div style={{ background: "rgba(11,15,25,0.6)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "18px", padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <h2 style={{ fontSize: "11px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: "6px", margin: 0, fontFamily: "monospace" }}>
                    <Calendar style={{ width: "14px", height: "14px", color: "#2dd4bf" }} /> Eventos
                </h2>
                <button onClick={() => setIsDrawerOpen(true)}
                    style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 12px", background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.3)", borderRadius: "8px", color: "#2dd4bf", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>
                    <Plus style={{ width: "11px", height: "11px" }} /> Nuevo
                </button>
            </div>

            {events.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px", background: "rgba(15,23,42,0.5)", border: "1px dashed rgba(30,41,59,0.8)", borderRadius: "12px" }}>
                    <p style={{ fontSize: "12px", color: "#334155", fontFamily: "monospace" }}>No hay eventos vinculados a este lead.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {events.map(event => (
                        <div key={event.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px", background: "rgba(15,23,42,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "12px" }}>
                            <div style={{ flexShrink: 0, width: "42px", textAlign: "center", background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.2)", borderRadius: "10px", padding: "4px 0" }}>
                                <p style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", color: "#0d9488", fontFamily: "monospace" }}>{format(new Date(event.startDate), 'MMM', { locale: es })}</p>
                                <p style={{ fontSize: "16px", fontWeight: 900, color: "#2dd4bf", fontFamily: "monospace" }}>{format(new Date(event.startDate), 'dd')}</p>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</h3>
                                <p style={{ fontSize: "11px", color: "#475569", margin: "0 0 6px" }}>{event.description || "Sin descripción"}</p>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "10px", fontWeight: 800, fontFamily: "monospace", textTransform: "uppercase", color: "#334155" }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#475569" }}>
                                        <Clock style={{ width: "10px", height: "10px" }} /> {format(new Date(event.startDate), 'HH:mm')}
                                    </span>
                                    {event.type === 'ONLINE' && <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#38bdf8" }}><Video style={{ width: "10px", height: "10px" }} /> Online</span>}
                                    {event.type === 'PHYSICAL' && <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#fb923c" }}><MapPin style={{ width: "10px", height: "10px" }} /> Presencial</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <EventDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} eventId={null} onEventSaved={handleEventSaved} />
        </div>
    );
}
