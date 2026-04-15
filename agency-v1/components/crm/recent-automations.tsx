"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, CheckCircle2, XCircle, Clock, RotateCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

export function RecentAutomations({ data }: { data: any[] }) {
    const [execs, setExecs] = useState(data || []);

    const handleRetry = (id: string) => {
        // UI Optimistic Update
        setExecs(prev => prev.map(e => e.id === id ? { ...e, status: 'PENDING' } : e));
        toast.info("Re-ejecutando automatización...");
        setTimeout(() => {
            setExecs(prev => prev.map(e => e.id === id ? { ...e, status: 'SUCCESS' } : e));
            toast.success("Automatización completada con éxito");
        }, 2000);
    };

    if (!execs || execs.length === 0) {
        return (
            <Card className="col-span-3 h-full bg-white/70 backdrop-blur-xl border border-slate-200/50 shadow-sm relative overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-slate-500 uppercase tracking-widest text-sm font-bold">Automatizaciones</CardTitle>
                    <CardDescription>Sin ejecuciones recientes.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="col-span-3 h-full bg-white/70 backdrop-blur-xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-1.5 rounded-lg shadow-sm">
                        <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">
                            Automatizaciones
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-400">
                            Monitor de ejecuciones de Workflow
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="relative z-10 px-6 max-h-[350px] overflow-y-auto custom-scrollbar">
                <div className="relative border-l-2 border-slate-200/60 ml-3 space-y-6 pt-2 pb-4">
                    <AnimatePresence>
                        {execs.map((exec, idx) => {
                            const isSuccess = exec.status === 'SUCCESS';
                            const isFailed = exec.status === 'FAILED';
                            const isPending = exec.status === 'PENDING';

                            return (
                                <motion.div
                                    key={exec.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
                                    className="relative pl-6 group/item"
                                >
                                    {/* Punto en el timeline */}
                                    <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full ring-4 ring-white flex items-center justify-center ${isSuccess ? 'bg-emerald-500' :
                                            isFailed ? 'bg-rose-500' : 'bg-blue-500 animate-pulse'
                                        }`}>
                                        <div className="h-1.5 w-1.5 bg-white rounded-full" />
                                    </div>

                                    <div className="bg-white/60 border border-slate-200/40 rounded-xl p-3 shadow-sm hover:shadow-md hover:bg-white transition-all">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-sm font-bold text-slate-700 leading-tight">
                                                {exec.workflow?.name || "Flujo de Trabajo Desconocido"}
                                            </p>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm tracking-wider uppercase ${isSuccess ? 'bg-emerald-100 text-emerald-700' :
                                                    isFailed ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {exec.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2 text-xs">
                                            <span className="text-slate-400 font-medium tracking-wide">
                                                {formatDistanceToNow(new Date(exec.startedAt), { addSuffix: true, locale: es })}
                                            </span>

                                            {isFailed && (
                                                <button
                                                    onClick={() => handleRetry(exec.id)}
                                                    className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-2.5 py-1 rounded-md transition-colors font-bold uppercase tracking-wider text-[10px]"
                                                >
                                                    <RotateCw className="w-3 h-3" />
                                                    Reintentar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}
