"use client";

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { SocialComposerDrawer } from './social-composer-drawer';
import { updateSocialPost } from '@/actions/social-publisher';
import { toast } from 'sonner';
import { CalendarIcon, Plus, Globe } from 'lucide-react';

export function SocialCalendar({ companyId, authorId, initialPosts }: { companyId: string, authorId: string, initialPosts: any[] }) {
    const [posts, setPosts] = useState(initialPosts);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [timeZone, setTimeZone] = useState("local");

    // Mapeo posts a eventos de FullCalendar
    const events = posts.map(post => {
        // Asignar colores según status
        let bgColor = '#1e293b'; // slate-800 draft
        let borderColor = '#334155'; // slate-700
        
        if (post.status === 'SCHEDULED') {
            bgColor = '#0f766e'; // teal-700
            borderColor = '#14b8a6'; // teal-500
        } else if (post.status === 'PUBLISHED') {
            bgColor = '#0369a1'; // sky-700
            borderColor = '#0ea5e9'; // sky-500
        }

        // Enterprise: Aprobaciones y Campañas
        let approvalIcon = '';
        if (post.approvalStatus === 'APPROVED') approvalIcon = '✅ ';
        else if (post.approvalStatus === 'REJECTED') approvalIcon = '❌ ';
        else if (post.approvalStatus === 'PENDING') approvalIcon = '⏳ ';
        else if (post.approvalStatus === 'IN_REVIEW') approvalIcon = '👁️ ';

        if (post.campaign) {
            // Apply campaign brand colors if they exist
            if (post.campaign.brandColors && post.campaign.brandColors.length > 0) {
                bgColor = post.campaign.brandColors[0];
                borderColor = post.campaign.brandColors[1] || bgColor;
            } else if (post.campaign.color) {
                bgColor = post.campaign.color;
                borderColor = bgColor;
            }
        }

        let titleStr = post.content ? (post.content.length > 25 ? post.content.substring(0, 25) + '...' : post.content) : "Sin título";
        
        let displayTitle = `${approvalIcon}${post.campaignId ? '🏷️ ' : ''}${titleStr}`;

        return {
            id: post.id,
            title: displayTitle,
            start: post.scheduledAt || post.createdAt, // fallback a creacion si no hay programada (drafts)
            extendedProps: { ...post },
            backgroundColor: bgColor,
            borderColor: borderColor,
            textColor: '#f8fafc' // slate-50
        };
    });

    const handleDateClick = (arg: any) => {
        // Abrimos composer en modo creacion
        setSelectedDate(arg.date);
        setSelectedPost(null);
        setDrawerOpen(true);
    };

    const handleEventClick = (arg: any) => {
        // Abrimos composer en modo edicion
        setSelectedDate(arg.event.start);
        setSelectedPost(arg.event.extendedProps);
        setDrawerOpen(true);
    };

    const handleEventDrop = async (arg: any) => {
        const postId = arg.event.id;
        const newDate = arg.event.start;
        
        // Optimistic UI update
        const updatedPosts = posts.map(p => p.id === postId ? { ...p, scheduledAt: newDate } : p);
        setPosts(updatedPosts);
        
        // Update via Action
        const res = await updateSocialPost(postId, authorId, { scheduledAt: newDate });
        if (res.success) {
            toast.success("Publicación reprogramada con éxito.");
        } else {
            toast.error("Error al mover la publicación. Revirtiendo...");
            // revert
            setPosts(posts); // Esto no es perfecto rollback pero es un fallback
        }
    };

    const refreshPosts = () => {
        // Instrucción para recargar la ruta Next.js (El action `createSocialPost` ya lanza revalidatePath, 
        // pero podemos requerir recargar localmente o dejar que router haga .refresh() ).
        window.location.reload(); 
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
            {/* Calendar Controls Extra */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <CalendarIcon className="text-teal-500" /> Multi-Platform Publisher
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest flex items-center gap-2">
                        Arrastra para reprogramar <span className="text-slate-600">|</span> ⏳ Pendiente ✅ Aprobado ❌ Rechazado 🏷️ Campaña
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700 text-sm">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <select 
                            value={timeZone} 
                            onChange={e => setTimeZone(e.target.value)}
                            className="bg-transparent border-none text-slate-200 focus:outline-none focus:ring-0"
                        >
                            <option value="local">Local</option>
                            <option value="UTC">UTC</option>
                            <option value="America/Bogota">Colombia (Bogotá)</option>
                            <option value="America/Mexico_City">México (CDMX)</option>
                            <option value="Europe/Madrid">España (Madrid)</option>
                            <option value="America/New_York">EE.UU. (EST)</option>
                        </select>
                    </div>
                    <button 
                        onClick={() => {
                            setSelectedDate(new Date());
                            setSelectedPost(null);
                            setDrawerOpen(true);
                        }}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-md text-sm transition-colors shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                    >
                        <Plus size={16} /> Crear Publicación
                    </button>
                </div>
            </div>

            {/* Custom FullCalendar CSS Wrapper */}
            <div className="fc-dark-theme">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={events}
                    timeZone={timeZone}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    editable={true} // Enables Drag and Drop scheduling
                    eventDrop={handleEventDrop}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek'
                    }}
                    height="700px"
                    themeSystem="standard"
                    dayMaxEvents={3}
                />
            </div>

            {/* Injected CSS para adaptar FullCalendar al HUD Slate-950 de LegacyMark */}
            <style jsx global>{`
                .fc-dark-theme .fc {
                    --fc-page-bg-color: #0f172a; /* slate-900 */
                    --fc-neutral-bg-color: #1e293b; /* slate-800 */
                    --fc-neutral-text-color: #94a3b8; /* slate-400 */
                    --fc-border-color: #334155; /* slate-700 */
                    --fc-button-text-color: #f1f5f9; /* slate-100 */
                    --fc-button-bg-color: #1e293b; /* slate-800 */
                    --fc-button-border-color: #334155; /* slate-700 */
                    --fc-button-hover-bg-color: #334155; /* slate-700 */
                    --fc-button-hover-border-color: #475569; /* slate-600 */
                    --fc-button-active-bg-color: #0f766e; /* teal-700 */
                    --fc-button-active-border-color: #14b8a6; /* teal-500 */
                    --fc-event-bg-color: #14b8a6;
                    --fc-event-border-color: #0d9488;
                    --fc-event-text-color: #fff;
                    --fc-today-bg-color: rgba(20, 184, 166, 0.1); /* teal-500 at 10% */
                }
                
                .fc-dark-theme .fc .fc-toolbar-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #f8fafc;
                }
                
                .fc-dark-theme .fc .fc-col-header-cell-cushion {
                    color: #94a3b8;
                    font-weight: 600;
                    font-size: 0.875rem;
                    padding: 8px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                
                .fc-dark-theme .fc .fc-daygrid-day-number {
                    color: #cbd5e1;
                    font-size: 0.875rem;
                    font-weight: 500;
                    padding: 4px 8px;
                }

                .fc-dark-theme .fc .fc-event {
                    border-radius: 4px;
                    padding: 2px 4px;
                    font-size: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .fc-dark-theme .fc .fc-event:hover {
                    filter: brightness(1.2);
                }
            `}</style>            

            {/* Composer Drawer */}
            <SocialComposerDrawer
                companyId={companyId}
                authorId={authorId}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSaved={refreshPosts}
                selectedDate={selectedDate}
                existingPost={selectedPost}
            />
        </div>
    );
}
