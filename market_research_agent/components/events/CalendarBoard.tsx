"use client";

import { useMemo, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import resourcePlugin from "@fullcalendar/resource";
import esLocale from "@fullcalendar/core/locales/es";

interface CalendarBoardProps {
    events: any[];
    resources?: any[];
    filters: any;
    selectedDate?: Date;
    onEventClick: (id: string) => void;
    onEventDropped: (id: string, start: Date, end: Date | null) => void;
    onDateSelect?: (start: Date, end: Date, allDay: boolean) => void;
}

// ── Color map (inline, PurgeCSS-safe) ────────────────────────────────────────
const TYPE_COLORS: Record<string, { point: string; bg: string; text: string; fc: string }> = {
    ONLINE: { point: '#60a5fa', bg: 'rgba(59,130,246,0.20)', text: '#bfdbfe', fc: '#2563eb' },
    PHYSICAL: { point: '#fb923c', bg: 'rgba(234,88,12,0.20)', text: '#fed7aa', fc: '#ea580c' },
    HYBRID: { point: '#c084fc', bg: 'rgba(147,51,234,0.20)', text: '#e9d5ff', fc: '#9333ea' },
    NETWORKING: { point: '#2dd4bf', bg: 'rgba(13,148,136,0.25)', text: '#99f6e4', fc: '#0d9488' },
    MEETING: { point: '#22d3ee', bg: 'rgba(8,145,178,0.22)', text: '#a5f3fc', fc: '#0891b2' },
    TASK: { point: '#fbbf24', bg: 'rgba(217,119,6,0.22)', text: '#fde68a', fc: '#d97706' },
    OTHER: { point: '#a78bfa', bg: 'rgba(124,58,237,0.22)', text: '#ddd6fe', fc: '#7c3aed' },
};
const FALLBACK_COLOR = { point: '#94a3b8', bg: 'rgba(100,116,139,0.18)', text: '#cbd5e1', fc: '#64748b' };

export function CalendarBoard({ events, resources = [], filters, selectedDate, onEventClick, onEventDropped, onDateSelect }: CalendarBoardProps) {
    const calendarRef = useRef<FullCalendar>(null);

    useEffect(() => {
        if (selectedDate && calendarRef.current) {
            calendarRef.current.getApi().gotoDate(selectedDate);
        }
    }, [selectedDate]);

    const calendarEvents = useMemo(() => {
        const query = filters.query?.toLowerCase() || '';

        return events
            .filter(e => {
                const matchType = filters.type === 'ALL' || e.type === filters.type;
                const matchQuery = !query || e.title.toLowerCase().includes(query);
                return matchType && matchQuery;
            })
            .map(e => {
                const c = TYPE_COLORS[e.type] ?? FALLBACK_COLOR;
                return {
                    id: e.id,
                    title: e.title,
                    start: e.startDate,
                    end: e.endDate,
                    allDay: e.isAllDay,
                    backgroundColor: c.fc,
                    borderColor: 'transparent',
                    extendedProps: { type: e.type, status: e.status, organizerName: e.organizer?.name }
                };
            });
    }, [events, filters]);

    const renderEventContent = (eventInfo: any) => {
        const { event, timeText } = eventInfo;
        const c = TYPE_COLORS[event.extendedProps.type] ?? FALLBACK_COLOR;

        return (
            <div
                style={{
                    background: c.bg,
                    border: `1px solid ${c.point}30`,
                    borderLeft: `3px solid ${c.point}`,
                    borderRadius: '6px',
                    padding: '3px 6px',
                    height: '100%',
                    width: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                }}
                title={`${event.title}${timeText ? ` (${timeText})` : ''}`}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: c.point, flexShrink: 0, boxShadow: `0 0 4px ${c.point}80`
                    }} />
                    <span style={{ fontSize: '10px', fontWeight: 800, color: c.text, letterSpacing: '0.04em', fontFamily: 'monospace' }}>
                        {timeText}
                    </span>
                </div>
                <div style={{
                    fontSize: '11px', fontWeight: 700, lineHeight: 1.3,
                    color: '#f1f5f9', overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                    {event.title}
                </div>
                {event.extendedProps.organizerName && (
                    <div style={{
                        fontSize: '9px', fontWeight: 600, color: 'rgba(148,163,184,0.8)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        marginTop: 'auto'
                    }}>
                        👤 {event.extendedProps.organizerName}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ padding: '20px', height: '100%', width: '100%', background: 'transparent', position: 'relative' }}>
            <style jsx global>{`
                /* ── Dark HUD FullCalendar Theme ───────────────────────────── */
                .fc {
                    --fc-border-color: rgba(30,41,59,0.8);
                    --fc-button-bg-color: rgba(15,23,42,0.8);
                    --fc-button-border-color: rgba(30,41,59,0.9);
                    --fc-button-text-color: #94a3b8;
                    --fc-button-hover-bg-color: rgba(13,148,136,0.15);
                    --fc-button-hover-border-color: rgba(13,148,136,0.4);
                    --fc-button-active-bg-color: rgba(13,148,136,0.25);
                    --fc-button-active-border-color: rgba(13,148,136,0.6);
                    --fc-today-bg-color: rgba(13,148,136,0.08);
                    --fc-event-border-color: transparent;
                    --fc-page-bg-color: transparent;
                    font-family: inherit;
                }

                /* Toolbar Title */
                .fc .fc-toolbar-title {
                    font-size: 1.2rem;
                    font-weight: 900;
                    color: #f1f5f9;
                    text-transform: capitalize;
                    letter-spacing: -0.02em;
                }

                /* Toolbar buttons */
                .fc .fc-button {
                    font-weight: 700;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-radius: 8px;
                    padding: 6px 14px;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(8px);
                }
                .fc .fc-button-primary:hover {
                    color: #2dd4bf !important;
                    border-color: rgba(13,148,136,0.5) !important;
                }
                .fc .fc-button-primary:not(:disabled):active,
                .fc .fc-button-primary:not(:disabled).fc-button-active {
                    background-color: rgba(13,148,136,0.25) !important;
                    color: #2dd4bf !important;
                    border-color: rgba(13,148,136,0.6) !important;
                    box-shadow: 0 0 12px rgba(13,148,136,0.2);
                }

                /* Grid borders */
                .fc-theme-standard td,
                .fc-theme-standard th,
                .fc-theme-standard .fc-scrollgrid {
                    border-color: rgba(30,41,59,0.7) !important;
                }
                .fc-scrollgrid {
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid rgba(30,41,59,0.8) !important;
                }

                /* Header cells (Mon, Tue, etc.) */
                .fc-col-header-cell {
                    background: rgba(15,23,42,0.8) !important;
                }
                .fc-col-header-cell-cushion {
                    padding: 10px 0 !important;
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #475569;
                    text-decoration: none !important;
                }

                /* Day cells */
                .fc-daygrid-day {
                    background: rgba(11,15,25,0.6) !important;
                    transition: background 0.2s;
                }
                .fc-daygrid-day:hover {
                    background: rgba(13,148,136,0.04) !important;
                }
                .fc-day-today {
                    background: rgba(13,148,136,0.07) !important;
                }

                /* Day numbers */
                .fc-daygrid-day-number {
                    font-weight: 700;
                    color: #64748b;
                    padding: 8px 10px !important;
                    font-size: 0.8rem;
                    text-decoration: none !important;
                }
                .fc-day-today .fc-daygrid-day-number {
                    background: linear-gradient(135deg, #0d9488, #0f766e);
                    color: white;
                    border-radius: 50%;
                    width: 26px;
                    height: 26px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 !important;
                    margin: 6px;
                    font-size: 0.75rem;
                    box-shadow: 0 0 12px rgba(13,148,136,0.4);
                }
                .fc-day-other .fc-daygrid-day-number {
                    color: #334155;
                }

                /* Events */
                .fc-event {
                    border: none !important;
                    background: transparent !important;
                    box-shadow: none;
                    cursor: pointer;
                    overflow: visible;
                }
                .fc-event:hover {
                    filter: brightness(1.15);
                    transform: translateY(-1px);
                    z-index: 10 !important;
                }
                .fc-daygrid-event {
                    margin-top: 2px !important;
                    border-radius: 6px;
                }
                .fc-daygrid-event-dot { display: none; }
                .fc-event-main { padding: 0 !important; overflow: visible; }

                /* Time grid */
                .fc-timegrid-slot-label-cushion {
                    font-size: 0.7rem;
                    color: #334155;
                    font-weight: 600;
                    font-family: monospace;
                }
                .fc-timegrid-col.fc-day-today {
                    background: rgba(13,148,136,0.04) !important;
                }
                .fc-timegrid-now-indicator-line {
                    border-color: #2dd4bf !important;
                    box-shadow: 0 0 6px rgba(45,212,191,0.4);
                }
                .fc-timegrid-now-indicator-arrow {
                    border-color: #2dd4bf transparent !important;
                }

                /* "More" link */
                .fc-daygrid-more-link {
                    font-size: 10px;
                    font-weight: 800;
                    color: #2dd4bf !important;
                    font-family: monospace;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                /* List view */
                .fc-list-day-cushion {
                    background: rgba(15,23,42,0.9) !important;
                }
                .fc-list-event:hover td {
                    background: rgba(13,148,136,0.08) !important;
                }
                .fc-list-day-text, .fc-list-day-side-text {
                    color: #2dd4bf !important;
                    text-decoration: none !important;
                }

                /* Scrollbars */
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(30,41,59,0.8); border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(13,148,136,0.4); }
            `}</style>

            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, resourcePlugin, resourceTimelinePlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek"
                }}
                locales={[esLocale]}
                locale="es"
                timeZone="local"
                events={calendarEvents}
                resources={resources}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                height="100%"
                eventContent={renderEventContent}
                eventClick={(info) => onEventClick(info.event.id)}
                eventDrop={(info) => onEventDropped(info.event.id, info.event.start!, info.event.end)}
                select={(info) => {
                    if (onDateSelect) onDateSelect(info.start, info.end, info.allDay);
                    info.view.calendar.unselect();
                }}
                nowIndicator={true}
                slotMinTime="06:00:00"
                slotMaxTime="23:00:00"
                allDayText="Día entero"
                slotLabelFormat={{ hour: 'numeric', minute: '2-digit', omitZeroMinute: false, meridiem: 'short' }}
                buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día', list: 'Agenda' }}
            />
        </div>
    );
}
