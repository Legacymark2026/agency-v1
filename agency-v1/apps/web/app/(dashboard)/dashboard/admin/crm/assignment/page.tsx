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
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    <Route className="w-8 h-8 text-indigo-500" /> Enrutador de Leads (Round-Robin)
                </h1>
                <p className="text-slate-500 mt-1">Crea reglas y distribuye equitativamente las oportunidades de venta entre tu equipo.</p>
            </div>

            {/* How it works banner */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex gap-4">
                <span className="text-2xl">⚡</span>
                <div>
                    <p className="text-sm font-bold text-indigo-900">Asignación Inteligente Rotativa</p>
                    <p className="text-sm text-indigo-800 mt-0.5">
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
