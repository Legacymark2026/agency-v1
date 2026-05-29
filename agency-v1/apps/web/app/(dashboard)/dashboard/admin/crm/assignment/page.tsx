import { getAssignmentRules, getTeamsAndAgents } from "@/actions/crm-assignment";
import { prisma } from "@/lib/prisma";
import { AssignmentRulesClient } from "@/components/crm/assignment-rules-client";
import { Route } from "lucide-react";

export default async function AssignmentPage() {
    const company = await prisma.company.findFirst();
    if (!company) return <div className="p-8 text-slate-500 text-center">Configura tu empresa primero.</div>;

    const rules = await getAssignmentRules(company.id);
    const { teams, agents } = await getTeamsAndAgents(company.id);

    return (
        <div className="ds-page space-y-6">
            <div>
                <h1 className="ds-heading-page flex items-center gap-3">
                    <Route className="w-8 h-8 text-teal-400" /> Enrutador de Leads (Round-Robin)
                </h1>
                <p className="ds-subtext mt-2">Crea reglas y distribuye equitativamente las oportunidades de venta entre tu equipo.</p>
            </div>

            {/* How it works banner */}
            <div className="ds-section flex gap-4" style={{ borderColor: 'var(--ds-border-glow)', background: 'var(--ds-teal-dim)' }}>
                <span className="text-2xl shrink-0">⚡</span>
                <div>
                    <p className="text-sm font-black text-slate-200">Asignación Inteligente Rotativa</p>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                        El motor evalúa las reglas de arriba a abajo por prioridad. Si un lead cumple las condiciones, se asigna al agente o se distribuye de forma equitativa (Round-Robin) dentro del equipo seleccionado. Si ninguna regla coincide, se distribuye globalmente.
                    </p>
                </div>
            </div>

            <AssignmentRulesClient 
                initialRules={rules} 
                companyId={company.id} 
                teams={teams} 
                agents={agents} 
            />
        </div>
    );
}
