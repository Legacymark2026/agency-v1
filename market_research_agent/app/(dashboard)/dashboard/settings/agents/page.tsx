import { getAIAgents, deleteAIAgent } from "@/actions/ai-agents";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Plus, Bot, Settings, Trash2, Zap } from "lucide-react";
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Bot className="w-6 h-6 text-teal-400" />
                        Centralización de Agentes (Agent Hub)
                    </h2>
                    <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                        Gestiona y orquesta tus agentes especializados. Cada agente opera con instrucciones únicas y sus propias herramientas, garantizando una arquitectura robusta y segmentada.
                    </p>
                </div>
                <Link
                    href="/dashboard/settings/agents/new"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:pointer-events-none disabled:opacity-50 bg-teal-500 text-slate-950 hover:bg-teal-400 h-10 px-4 py-2"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Agente
                </Link>
            </div>

            {agents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-700 bg-slate-900/50">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Bot className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white">No hay agentes configurados</h3>
                    <p className="text-sm text-slate-400 mt-2 mb-6 max-w-sm">
                        Crea tu primer agente especializado para empezar a delegar tareas de soporte, ventas o redacción en tu plataforma.
                    </p>
                    <Link
                        href="/dashboard/settings/agents/new"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-10 px-4 py-2"
                    >
                        Comenzar ahora
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map((agent) => (
                        <div
                            key={agent.id}
                            className="group relative flex flex-col rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm transition-all hover:border-teal-500/50 hover:bg-slate-900 overflow-hidden"
                        >
                            {/* Glowing effect on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="relative flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                                        <Bot className="w-5 h-5 text-teal-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white leading-none">{agent.name}</h3>
                                        <div className="flex items-center gap-2 mt-2 text-xs">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${agent.isActive ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                                {agent.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                            <span className="text-slate-500 flex items-center gap-1">
                                                <Zap className="w-3 h-3" />
                                                {agent.llmModel}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="relative text-sm text-slate-400 line-clamp-2 flex-grow mb-6">
                                {agent.description || "Agente especializado sin descripción."}
                            </p>
                            
                            <div className="relative pt-4 border-t border-slate-800 flex justify-between items-center mt-auto">
                                <span className="text-xs text-slate-500">
                                    {(agent.enabledTools as any[])?.length || 0} Herramientas
                                </span>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/dashboard/settings/agents/${agent.id}`}
                                        className="p-2 text-slate-400 hover:text-white transition-colors rounded-md hover:bg-slate-800"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </Link>
                                    <form action={async () => {
                                        "use server";
                                        await deleteAIAgent(agent.id);
                                    }}>
                                        <button
                                            type="submit"
                                            className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-md hover:bg-slate-800"
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
