import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSkillChains } from "@/actions/skillchains";
import { getAIAgents } from "@/actions/ai-agents";
import { SkillchainManager } from "@/components/settings/skillchain-manager";
import type { AIAgent } from "@prisma/client";
import { Link2, Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "5x Skillchains — LegacyMark",
    description: "Orquesta cadenas de habilidades autónomas para tus agentes de IA."
};

export default async function SkillchainsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });
    if (!companyUser) redirect("/dashboard");

    const { companyId } = companyUser;

    const [chains, agents] = await Promise.all([
        getSkillChains(companyId),
        getAIAgents(companyId)
    ]);

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-12">

            {/* ── Page Header ── */}
            <div className="border-b border-slate-800/60 pb-6">
                <Link
                    href="/dashboard/settings/agents"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver a Agent Hub
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-teal-950/60 border border-teal-800/40 flex items-center justify-center">
                                <Link2 className="w-5 h-5 text-teal-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-white">
                                    5x Skillchain Studio
                                </h1>
                                <p className="text-[11px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
                                    Autonomous Workflow Orchestration
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                            Encadena hasta{" "}
                            <span className="text-teal-400 font-semibold">5 herramientas</span>{" "}
                            en una macro-habilidad autónoma. El agente ejecuta la cadena completa
                            en una sola invocación — sin turnos intermedios con el LLM,
                            reduciendo costos y latencia hasta un{" "}
                            <span className="text-teal-400 font-semibold">80%</span>.
                        </p>
                    </div>

                    {/* How it works chip */}
                    <div className="flex-shrink-0 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 max-w-xs">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">
                            Cómo funciona
                        </p>
                        <div className="space-y-1.5 text-[11px] text-slate-400">
                            {[
                                "El agente detecta la intención del usuario",
                                "Selecciona el Skillchain apropiado",
                                "Ejecuta las herramientas en secuencia",
                                "Acumula el contexto entre pasos",
                                "Entrega el resultado final al chat",
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] text-slate-400 font-mono flex-shrink-0">
                                        {i + 1}
                                    </span>
                                    <span>{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Warning if no agents */}
                {agents.length === 0 && (
                    <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-orange-950/30 border border-orange-900/30 text-xs text-orange-300">
                        <Zap className="w-4 h-4 flex-shrink-0" />
                        Necesitas al menos un agente creado para asignarle un Skillchain.{" "}
                        <Link href="/dashboard/settings/agents/new" className="underline hover:text-orange-100">
                            Crear agente →
                        </Link>
                    </div>
                )}
            </div>

            {/* ── Manager ── */}
            <SkillchainManager
                companyId={companyId}
                agents={agents.map((a: AIAgent) => ({ id: a.id, name: a.name, agentType: a.agentType }))}
                initialChains={chains as any}
            />
        </div>
    );
}
