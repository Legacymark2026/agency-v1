import { Metadata } from "next";
import { QuickInsights } from "@/modules/analytics/components/quick-insights";
import { getQuickInsights } from "@/modules/analytics/actions/analytics";
import { ActivityHeatmap } from "@/modules/analytics/components/activity-heatmap";
import { getActivityHeatmap } from "@/modules/analytics/actions/analytics";
import { Sparkles, BrainCircuit, Lightbulb, Zap, ArrowUpRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "AI Insights | LegacyMark Command Center",
    description: "Análisis predictivo y recomendaciones estratégicas generadas por IA.",
};

export default async function AIInsightsPage() {
    // Parallel fetch for speed
    const [insights, heatmapData] = await Promise.all([
        getQuickInsights(),
        getActivityHeatmap()
    ]);

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-700">
            {/* HUD Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/60">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <div className="ds-icon-box w-10 h-10 bg-teal-500/10 border-teal-500/20">
                            <BrainCircuit className="text-teal-400 w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                                AI Insights <span className="ds-badge ds-badge-teal text-[10px]">PREDICTIVE_ENGINE</span>
                            </h1>
                            <p className="font-mono text-xs text-slate-500 uppercase tracking-widest mt-1">
                                Procesando flujo de datos globales · <span className="text-teal-500/70">Neural Net Active</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="ds-btn-secondary border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200">
                        <Zap className="mr-2 h-3.5 w-3.5" /> Re-entrenar Modelo
                    </Button>
                    <Button className="ds-btn-primary bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 shadow-lg shadow-teal-500/20">
                        Exportar Reporte <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Smart Insights Row */}
            <div className="grid gap-6">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/20 to-purple-500/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <QuickInsights data={insights} />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Heatmap Section */}
                <div className="lg:col-span-2 ds-card p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-200 text-sm">Frecuencia de Actividad</h3>
                                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Mapa de calor de interacciones anuales</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                                <span className="w-2 h-2 rounded-full bg-slate-800" /> Menos
                                <span className="w-2 h-2 rounded-full bg-teal-900" />
                                <span className="w-2 h-2 rounded-full bg-teal-700" />
                                <span className="w-2 h-2 rounded-full bg-teal-500" />
                                <span className="w-2 h-2 rounded-full bg-teal-300" /> Más
                             </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <ActivityHeatmap data={heatmapData} />
                    </div>
                </div>

                {/* Recommendations Column */}
                <div className="space-y-6">
                    <div className="ds-card p-6 bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <Lightbulb className="w-4 h-4 text-amber-400" />
                            </div>
                            <h3 className="font-bold text-white text-sm uppercase tracking-tight">Oportunidades Hoy</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { title: "Optimizar Checkout", desc: "Se detectó fricción en dispositivos iOS.", impact: "High" },
                                { title: "Campaña Retargeting", desc: "1.2k usuarios abandonaron carrito.", impact: "Medium" }
                            ].map((rec, i) => (
                                <div key={i} className="group p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-xs text-white group-hover:text-teal-400 transition-colors">{rec.title}</h4>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rec.impact === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                            {rec.impact}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">{rec.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="ds-card p-6 border-slate-800/40 bg-slate-900/20">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-[0.2em]">Neural Status</p>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-500">Precisión del Modelo</span>
                                <span className="text-white font-bold">98.2%</span>
                            </div>
                            <div className="w-full bg-slate-800/50 h-1 rounded-full overflow-hidden">
                                <div className="bg-teal-500 h-full w-[98%] shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                            </div>
                            <p className="text-[10px] text-slate-600 italic">Entrenado con 124,500 eventos ayer.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
