import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAgentTeams } from "@/actions/agent-teams";
import { getAIAgents } from "@/actions/ai-agents";
import { AgentTeamManager } from "@/components/settings/agent-team-manager";
import { Users, ArrowLeft, Zap, GitBranch } from "lucide-react";
import Link from "next/link";
import type { AIAgent } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agent Teams — LegacyMark" };

export default async function AgentTeamsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });
    if (!companyUser) redirect("/dashboard");

    const { companyId } = companyUser;
    const [teams, agents] = await Promise.all([
        getAgentTeams(companyId),
        getAIAgents(companyId)
    ]);

    const activeAgents = agents.filter((a: AIAgent) => a.isActive);

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-12">
            {/* Header */}
            <div className="border-b border-slate-800/60 pb-6">
                <Link href="/dashboard/settings/agents"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white mb-4 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver a Agent Hub
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center">
                                <Users className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-white">Agent Team Studio</h1>
                                <p className="text-[11px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
                                    Parallel Workforce Orchestration
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                            Forma <span className="text-purple-400 font-semibold">fuerzas de trabajo autónomas</span> combinando tus agentes especializados.
                            Los equipos ejecutan tareas complejas en paralelo, secuencia o por votación —
                            con síntesis inteligente del output final.
                        </p>
                    </div>

                    {/* Strategy legend */}
                    <div className="flex-shrink-0 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 min-w-[220px]">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3">Estrategias de Ejecución</p>
                        <div className="space-y-2 text-[11px]">
                            {[
                                { icon: <Zap className="w-3 h-3 text-teal-400"/>,    label: "Paralelo",   desc: "Todos al mismo tiempo" },
                                { icon: <GitBranch className="w-3 h-3 text-blue-400"/>, label: "Secuencial", desc: "Uno pasa el contexto al siguiente" },
                                { icon: <Users className="w-3 h-3 text-purple-400"/>,  label: "Votación",   desc: "El mejor resultado gana" },
                            ].map(s => (
                                <div key={s.label} className="flex items-center gap-2 text-slate-400">
                                    {s.icon}
                                    <span className="font-semibold text-slate-300">{s.label}:</span>
                                    <span>{s.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {activeAgents.length < 2 && (
                    <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-orange-950/30 border border-orange-900/30 text-xs text-orange-300">
                        <Zap className="w-4 h-4 flex-shrink-0" />
                        Necesitas al menos 2 agentes activos para crear un equipo.{" "}
                        <Link href="/dashboard/settings/agents/new" className="underline hover:text-orange-100">Crear agente →</Link>
                    </div>
                )}
            </div>

            <AgentTeamManager
                companyId={companyId}
                agents={activeAgents.map((a: AIAgent) => ({
                    id: a.id, name: a.name, agentType: a.agentType,
                    llmModel: a.llmModel, isActive: a.isActive
                }))}
                initialTeams={teams as any}
            />
        </div>
    );
}
