import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AgentBuilderForm } from "@/components/settings/agent-builder-form";
import { getAIAgentById, getKnowledgeBases } from "@/actions/ai-agents";

export const dynamic = 'force-dynamic';

export default async function EditAgentPage(props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await auth();
        if (!session || !session.user) redirect("/auth/login");

        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id },
            select: { companyId: true }
        });

        if (!companyUser) redirect("/dashboard");

        const agent = await getAIAgentById(params.id);
        if (!agent || agent.companyId !== companyUser.companyId) {
            redirect("/dashboard/settings/agents");
        }

        const kbOptions = await getKnowledgeBases(companyUser.companyId);

        return (
            <div className="animate-in fade-in duration-300">
                <AgentBuilderForm 
                    companyId={companyUser.companyId} 
                    knowledgeBases={kbOptions}
                    initialData={agent} 
                />
            </div>
        );
    } catch (error: any) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-950/20 border border-red-900 rounded-lg">
                <h3 className="text-lg font-bold mb-2">Error del Servidor Renders</h3>
                <p className="font-mono text-sm break-words">{error?.message || String(error)}</p>
                <p className="text-xs text-slate-400 mt-4">Pasa esta captura al ingeniero del sistema.</p>
            </div>
        );
    }
}
