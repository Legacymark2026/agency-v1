"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Activity as ActivityIcon, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Activity { id: string; type: string; title: string; desc: string; date: Date; }
interface ActivityProps { activities: Activity[]; }

export function RecentActivity({ activities }: ActivityProps) {
    return (
        <div className="ds-section h-full flex flex-col relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-2 relative z-10"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div className="flex items-center gap-3">
                    <div className="ds-icon-box w-8 h-8">
                        <ActivityIcon size={14} strokeWidth={1.5} className="text-teal-400" />
                    </div>
                    <div>
                        <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Registro de Actividad Reciente</p>
                        <p className="font-mono text-xs text-slate-700 uppercase tracking-widest mt-0.5">Historial automático de eventos</p>
                    </div>
                </div>
                {/* Live badge */}
                <span className="ds-badge ds-badge-teal">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                    </span>
                    Live
                </span>
            </div>

            {/* Activities */}
            {!activities || activities.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">&gt; Sin actividad registrada_</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-1 relative z-10 space-y-0"
                    style={{ borderLeft: '1px solid rgba(30,41,59,0.8)', marginLeft: '1.5rem', paddingLeft: '1.25rem', paddingTop: '0.5rem' }}>
                    {activities.map((activity, i) => {
                        const isDeal = activity.type === 'DEAL';
                        return (
                            <motion.div
                                key={`${activity.type}-${activity.id}-${i}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04, duration: 0.3 }}
                                className="relative group/item pb-4"
                            >
                                {/* Timeline dot */}
                                <div className="absolute -left-[calc(1.25rem+0.75rem)] top-3 h-6 w-6 rounded-sm flex items-center justify-center"
                                    style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(30,41,59,0.8)' }}>
                                    <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-xs rounded-sm bg-transparent">
                                            {isDeal
                                                ? <ArrowUpCircle className="w-3 h-3 text-teal-500" />
                                                : <ArrowDownCircle className="w-3 h-3 text-slate-500" />}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                {/* Content card */}
                                <div className="ds-card-sm group/item-card">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-bold text-slate-200 leading-snug truncate">{activity.title}</p>
                                            <p className="text-xs text-slate-500 font-light mt-0.5 leading-relaxed">{activity.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`w-1 h-1 rounded-full ${isDeal ? 'bg-teal-500' : 'bg-slate-600'}`} />
                                        <span className="font-mono text-xs text-slate-600 uppercase tracking-widest">
                                            {formatDistanceToNow(new Date(activity.date), { addSuffix: true, locale: es })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
