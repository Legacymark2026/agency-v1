import { Suspense } from "react";
import { QuickInsights } from "@/modules/analytics/components/quick-insights";
import { getQuickInsights } from "@/modules/analytics/actions/analytics";
import { Zap, Bot, Sparkles, TrendingUp, AlertCircle, Target, ArrowRight } from "lucide-react";
import { TrackPageEvent } from "@/modules/analytics/components/track-page-event";

export const metadata = {
    title: "AI Insights | LegacyMark Command Center",
    description: "Análisis predictivo y recomendaciones estratégicas generadas por IA.",
};

export default async function AIInsightsPage() {
    const insights = await getQuickInsights();

    return (
        <div className="ds-page space-y-6">
            <TrackPageEvent eventName="ViewAIInsights" isCustom={true} />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* Header */}
            <div className="relative z-10 flex flex-col gap-4 pb-6" style={{ borderBottom: "1px solid rgba(30,41,59,0.8)" }}>
                <div>
                    <div className="mb-3">
                        <span className="ds-badge ds-badge-teal">
                            <Bot className="w-3 h-3 mr-1.5" />
                            AI_CORE · PREDICTIVE ENGINE
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-12 h-12">
                            <Zap className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="ds-heading-page">AI Insights & Predicciones</h1>
                            <p className="ds-subtext mt-1">Recomendaciones estratégicas basadas en el comportamiento de tus leads y campañas.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 space-y-6">
                <Suspense fallback={<div className="h-48 ds-card animate-pulse bg-slate-900/50" />}>
                    <QuickInsights data={insights} />
                </Suspense>

                {/* Additional AI Sections Placeholder */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="ds-card group">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="ds-icon-box w-8 h-8">
                                <TrendingUp className="w-4 h-4 text-purple-400" />
                            </div>
                            <h3 className="font-bold text-slate-100">Análisis de Tendencias</h3>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed mb-4">
                            Nuestro motor de IA ha detectado un patrón de crecimiento en el segmento B2B para servicios de Consultoría durante las últimas 72 horas.
                        </p>
                        <button className="flex items-center gap-2 text-xs font-black text-teal-400 uppercase tracking-widest hover:gap-3 transition-all">
                            Ver Reporte Detallado <ArrowRight size={12} />
                        </button>
                    </div>

                    <div className="ds-card group">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="ds-icon-box w-8 h-8">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                            </div>
                            <h3 className="font-bold text-slate-100">Alertas de Retención</h3>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed mb-4">
                            Se ha identificado una posible caída en el engagement de la campaña "Spring Sale" en Instagram. Recomendamos ajustar el copy creativo.
                        </p>
                        <button className="flex items-center gap-2 text-xs font-black text-teal-400 uppercase tracking-widest hover:gap-3 transition-all">
                            Optimizar Campaña <ArrowRight size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
