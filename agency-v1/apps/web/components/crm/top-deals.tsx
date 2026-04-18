"use client";

import Link from "next/link";
import { CRM_CURRENCY_FORMATTER } from "@/lib/crm-charts-config";
import { ArrowUpRight, Maximize2, X, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Deal { id: string; title: string; value: number; stage: string; probability: number; }
interface TopDealsProps { deals: Deal[]; }

const STAGE_BADGE: Record<string, string> = {
    'LEAD': 'ds-badge-slate',
    'QUALIFIED': 'ds-badge-blue',
    'PROPOSAL': 'ds-badge-teal',
    'NEGOTIATION': 'ds-badge-amber',
    'CLOSED_WON': 'ds-badge-green',
    'CLOSED_LOST': 'ds-badge-red',
};

export function TopDeals({ deals }: TopDealsProps) {
    const [selected, setSelected] = useState<Deal | null>(null);

    return (
        <>
            <div className="ds-section h-full flex flex-col relative overflow-hidden group">
                {/* Ambient */}
                <div className="absolute top-0 left-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-2 relative z-10"
                    style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                    <div className="flex items-center gap-3">
                        <div className="ds-icon-box w-8 h-8">
                            <Flame size={14} strokeWidth={1.5} className="text-teal-400" />
                        </div>
                        <div>
                            <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Top Deals Priority</p>
                            <p className="font-mono text-xs text-slate-700 uppercase tracking-widest mt-0.5">Tratos calientes · próximos al cierre</p>
                        </div>
                    </div>
                    <Link href="/dashboard/admin/crm/pipeline"
                        className="ds-icon-box w-8 h-8 hover:border-teal-800 transition-all">
                        <ArrowUpRight size={14} strokeWidth={1.5} className="text-slate-500 hover:text-teal-400 transition-colors" />
                    </Link>
                </div>

                {/* Deals list */}
                <div className="flex-1 space-y-2 relative z-10 overflow-y-auto">
                    {deals.length === 0 ? (
                        <div className="py-10 flex flex-col items-center justify-center">
                            <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">&gt; No hay pipeline crítico_</p>
                        </div>
                    ) : (
                        deals.map((deal, i) => {
                            const hot = deal.value > 10000 && deal.probability > 70;
                            return (
                                <motion.div
                                    key={deal.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className={`group/item flex items-center justify-between p-3 transition-all duration-300 relative ${hot
                                            ? 'bg-teal-950/30 border border-teal-900/40'
                                            : 'bg-slate-900/30 border border-slate-800/50 hover:border-slate-700/50'
                                        } rounded-sm`}
                                >
                                    {/* Hot indicator */}
                                    {hot && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-400 to-emerald-500 rounded-l-sm" />}

                                    <div className="flex-1 min-w-0 pl-2">
                                        <p className="font-bold text-[12px] text-slate-200 truncate">{deal.title}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className={`ds-badge ${hot ? 'ds-badge-teal' : 'ds-badge-slate'}`}>
                                                {hot && <Flame className="w-2 h-2" />}
                                                Prob. {deal.probability}%
                                            </span>
                                            <span className={`ds-badge ${STAGE_BADGE[deal.stage] ?? 'ds-badge-slate'}`}>
                                                {deal.stage}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 ml-3">
                                        <p className="font-black font-mono text-sm text-slate-100">
                                            {CRM_CURRENCY_FORMATTER.format(deal.value)}
                                        </p>
                                        <button
                                            onClick={() => setSelected(deal)}
                                            className="opacity-0 group-hover/item:opacity-100 transition-opacity ds-icon-box w-7 h-7 hover:border-teal-800"
                                        >
                                            <Maximize2 className="w-3 h-3 text-slate-500 hover:text-teal-400 transition-colors" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal peek */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelected(null)}
                            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 rounded-sm"
                            style={{ background: 'rgba(2,6,23,0.97)', border: '1px solid rgba(30,41,59,0.8)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7)' }}
                        >
                            <button
                                onClick={() => setSelected(null)}
                                className="absolute top-4 right-4 ds-icon-box w-7 h-7 hover:border-red-900/50"
                            >
                                <X className="w-3.5 h-3.5 text-slate-500 hover:text-red-400 transition-colors" />
                            </button>

                            {/* Teal accent top line */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

                            <div className="mb-6">
                                <span className="ds-badge ds-badge-teal mb-4 inline-flex">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                                    </span>
                                    {selected.stage} · DEAL_PREVIEW
                                </span>
                                <h2 className="text-2xl font-black text-slate-100 tracking-[-0.04em] leading-tight mt-3">{selected.title}</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="ds-card-sm">
                                    <p className="ds-mono-label mb-2">Valor Potencial</p>
                                    <p className="text-xl font-black font-mono text-teal-400">{CRM_CURRENCY_FORMATTER.format(selected.value)}</p>
                                </div>
                                <div className="ds-card-sm">
                                    <p className="ds-mono-label mb-2">Probabilidad</p>
                                    <p className="text-xl font-black font-mono text-amber-400">{selected.probability}%</p>
                                </div>
                            </div>

                            <div className="mt-5">
                                <Link
                                    href="/dashboard/admin/crm/pipeline"
                                    className="flex items-center justify-center gap-2 w-full py-2.5 font-mono text-xs uppercase tracking-widest text-white rounded-sm transition-all"
                                    style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.4)' }}
                                >
                                    <ArrowUpRight className="w-3.5 h-3.5" /> Ir al Pipeline
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
