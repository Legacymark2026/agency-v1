"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, PartyPopper, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface LeaderboardEntry { name: string; wonValue: number; }
interface SalesLeaderboardProps { data: LeaderboardEntry[]; }

const RANK_CONFIG = [
    { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-900/40', ring: 'ring-amber-500/30' },
    { icon: Medal, color: 'text-slate-300', bg: 'bg-slate-800/40 border-slate-700/40', ring: 'ring-slate-500/20' },
    { icon: Medal, color: 'text-orange-400', bg: 'bg-orange-950/20 border-orange-900/30', ring: 'ring-orange-500/20' },
];

export function SalesLeaderboard({ data }: SalesLeaderboardProps) {
    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    const fireKudos = (name: string, e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        confetti({
            particleCount: 80, spread: 60,
            origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight },
            colors: ['#14b8a6', '#10b981', '#f59e0b'], zIndex: 9999
        });
        toast.success(`¡Kudos enviados a ${name}! 🚀`);
    };

    return (
        <div className="ds-section h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-3 pb-4 mb-4 relative z-10"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div className="ds-icon-box w-8 h-8">
                    <Trophy size={14} strokeWidth={1.5} className="text-teal-400" />
                </div>
                <div>
                    <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Leaderboard</p>
                    <p className="font-mono text-xs text-slate-700 uppercase tracking-widest mt-0.5">Top Performers · By Revenue</p>
                </div>
                <span className="ml-auto ds-badge ds-badge-amber">RANKINGS</span>
            </div>

            {/* List */}
            <div className="flex-1 space-y-2 relative z-10">
                {data.length === 0 ? (
                    <div className="py-10 flex items-center justify-center">
                        <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">&gt; Sin datos de rendimiento_</p>
                    </div>
                ) : (
                    data.map((user, i) => {
                        const rank = RANK_CONFIG[i] ?? null;
                        const RankIcon = rank?.icon;
                        return (
                            <motion.div
                                key={user.name}
                                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
                                className={`group flex items-center p-3 transition-all duration-300 border rounded-sm ${rank
                                        ? `${rank.bg}`
                                        : 'bg-slate-900/30 border-slate-800/40 hover:border-slate-700/40'
                                    }`}
                            >
                                {/* Rank indicator */}
                                <div className="mr-3 w-5 flex justify-center shrink-0">
                                    {RankIcon
                                        ? <RankIcon className={`w-4 h-4 ${rank.color}`} strokeWidth={1.5} />
                                        : <span className="font-mono text-xs font-bold text-slate-600">{i + 1}</span>}
                                </div>

                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-sm flex items-center justify-center font-mono text-xs font-black shrink-0 ${rank ? `ring-1 ${rank.ring}` : ''}`}
                                    style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.8)' }}>
                                    {user.name.substring(0, 2).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="ml-3 flex-1 min-w-0">
                                    <p className="text-[12px] font-bold text-slate-200 truncate">{user.name}</p>
                                    <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">
                                        {i === 0 ? 'MVB · Most Valuable Biller' : 'Sales Representative'}
                                    </p>
                                </div>

                                {/* Value + Kudos */}
                                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                                    <span className="font-mono font-black text-sm text-slate-100">{fmt.format(user.wonValue)}</span>
                                    <button
                                        onClick={(e) => fireKudos(user.name, e)}
                                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-teal-400 hover:text-teal-300 transition-all"
                                    >
                                        <Zap className="w-2.5 h-2.5" /> Kudos
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
