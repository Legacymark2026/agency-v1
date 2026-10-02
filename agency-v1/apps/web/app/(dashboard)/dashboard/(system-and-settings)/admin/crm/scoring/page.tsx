import { getScoringRules } from "@/actions/crm-advanced";
import { prisma } from "@/lib/prisma";
import { ScoringRulesClient } from "@/components/crm/scoring-rules-client";
import { Zap } from "lucide-react";

export default async function ScoringPage() {
    const company = await prisma.company.findFirst();
    if (!company) return <div className="p-8 text-slate-500 text-center">Configura tu empresa primero.</div>;
    const rules = await getScoringRules(company.id);

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    <Zap className="w-8 h-8 text-amber-500" /> Lead Scoring
                </h1>
                <p className="text-slate-500 mt-1">Define reglas para calificar automáticamente la calidad de cada lead.</p>
            </div>

            {/* How it works */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-4">
                <span className="text-2xl">💡</span>
                <div>
                    <p className="text-sm font-bold text-amber-900">¿Cómo funciona?</p>
                    <p className="text-sm text-amber-800 mt-0.5">Cada regla evalúa un campo del lead y suma o resta puntos al score. El score final va de 0 a 100 y aparece en la tabla de leads. A mayor score, más caliente es el lead.</p>
                </div>
            </div>

            <ScoringRulesClient rules={rules} companyId={company.id} />
        </div>
    );
}
