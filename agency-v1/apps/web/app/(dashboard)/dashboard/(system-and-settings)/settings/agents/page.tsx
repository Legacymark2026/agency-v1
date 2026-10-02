import { getAIAgents, deleteAIAgent } from "@/actions/ai-agents";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Plus, Bot, Settings, Trash2, Zap, Users } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function AgentsListPage() {
    const session = await auth();
    if (!session || !session.user) redirect("/auth/login");

    // We assume the user is within a company context.
    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true, role: true }
    });

    if (!companyUser) redirect("/dashboard");

    const agents = await getAIAgents(companyUser.companyId);

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--ds-border)] pb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--ds-text-primary)] flex items-center gap-2">
                        <Bot className="w-6 h-6 text-[var(--ds-teal)]" />
                        Centralización de Agentes (Agent Hub)
                    </h2>
                    <p className="text-sm text-[var(--ds-text-secondary)] mt-2 max-w-2xl">
                        Gestiona y orquesta tus agentes especializados. Cada agente opera con instrucciones únicas y sus propias herramientas, garantizando una arquitectura robusta y segmentada.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/settings/agents/teams"
                        className="inline-flex items-center justify-center rounded-[0.15rem] text-sm font-medium transition-colors border border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-[var(--ds-text-secondary)] hover:bg-[var(--ds-surface)] hover:text-[var(--ds-text-primary)] h-10 px-4 py-2 gap-2">
                        <Users className="w-4 h-4 text-purple-400" /> Agent Teams
                    </Link>
                    <Link href="/dashboard/settings/agents/skillchains"
                        className="inline-flex items-center justify-center rounded-[0.15rem] text-sm font-medium transition-colors border border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-[var(--ds-text-secondary)] hover:bg-[var(--ds-surface)] hover:text-[var(--ds-text-primary)] h-10 px-4 py-2 gap-2">
                        <Zap className="w-4 h-4 text-[var(--ds-teal-md)]" /> 5x Skillchains
                    </Link>
                    <Link href="/dashboard/settings/agents/new"
                        className="inline-flex items-center justify-center rounded-[0.15rem] text-sm font-medium transition-colors bg-[var(--ds-teal)] text-white hover:bg-[var(--ds-teal-md)] h-10 px-4 py-2">
                        <Plus className="w-4 h-4 mr-2" /> Crear Agente
                    </Link>
                </div>
            </div>

            {agents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-[0.15rem] border border-dashed border-[var(--ds-border)] bg-[var(--ds-surface)]">
                    <div className="w-16 h-16 bg-[var(--ds-surface-2)] rounded-full flex items-center justify-center mb-4">
                        <Bot className="w-8 h-8 text-[var(--ds-text-muted)]" />
                    </div>
                    <h3 className="text-lg font-medium text-[var(--ds-text-primary)]">No hay agentes configurados</h3>
                    <p className="text-sm text-[var(--ds-text-muted)] mt-2 mb-6 max-w-sm">
                        Crea tu primer agente especializado para empezar a delegar tareas de soporte, ventas o redacción en tu plataforma.
                    </p>
                    <Link
                        href="/dashboard/settings/agents/new"
                        className="inline-flex items-center justify-center rounded-[0.15rem] text-sm font-medium transition-colors border border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface)] h-10 px-4 py-2"
                    >
                        Comenzar ahora
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map((agent) => (
                        <div
                            key={agent.id}
                            className="group relative flex flex-col rounded-[0.15rem] border border-[var(--ds-border)] bg-[var(--ds-surface)] p-6 shadow-[var(--ds-shadow-card)] transition-all hover:border-[var(--ds-border-glow)] hover:bg-[var(--ds-surface-2)]/40 overflow-hidden"
                        >
                            {/* Glowing effect on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--ds-teal-dim)]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="relative flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-[0.15rem] bg-[var(--ds-teal-dim)] flex items-center justify-center border border-[var(--ds-border-glow)]">
                                        <Bot className="w-5 h-5 text-[var(--ds-teal-md)]" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[var(--ds-text-primary)] leading-none">{agent.name}</h3>
                                        <div className="flex items-center gap-2 mt-2 text-xs">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-[0.15rem] font-mono text-[10px] font-bold uppercase tracking-wider ${agent.isActive ? 'bg-[var(--ds-teal-dim)] text-[var(--ds-teal-md)] border border-[var(--ds-border-glow)]' : 'bg-[var(--ds-surface-2)] text-[var(--ds-text-muted)] border border-[var(--ds-border)]'}`}>
                                                {agent.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                            <span className="text-[var(--ds-text-muted)] flex items-center gap-1">
                                                <Zap className="w-3 h-3" />
                                                {agent.llmModel}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="relative text-sm text-[var(--ds-text-secondary)] line-clamp-2 flex-grow mb-6">
                                {agent.description || "Agente especializado sin descripción."}
                            </p>
                            
                            <div className="relative pt-4 border-t border-[var(--ds-border)] flex justify-between items-center mt-auto">
                                <span className="text-xs text-[var(--ds-text-muted)] font-mono">
                                    {(agent.enabledTools as any[])?.length || 0} Herramientas
                                </span>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/dashboard/settings/agents/${agent.id}`}
                                        className="p-2 text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] transition-colors rounded-[0.15rem] hover:bg-[var(--ds-surface-2)]"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </Link>
                                    <form action={async () => {
                                        "use server";
                                        await deleteAIAgent(agent.id);
                                    }}>
                                        <button
                                            type="submit"
                                            className="p-2 text-[var(--ds-text-muted)] hover:text-red-400 transition-colors rounded-[0.15rem] hover:bg-[var(--ds-surface-2)]"
                                            title="Eliminar agente"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
