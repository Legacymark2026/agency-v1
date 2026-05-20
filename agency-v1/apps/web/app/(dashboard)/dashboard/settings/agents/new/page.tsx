import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AgentBuilderForm } from "@/components/settings/agent-builder-form";
import { getKnowledgeBases } from "@/actions/ai-agents";

export const dynamic = 'force-dynamic';

export default async function NewAgentPage() {
    const session = await auth();
    if (!session || !session.user) redirect("/auth/login");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) redirect("/dashboard");

    const kbOptions = await getKnowledgeBases(companyUser.companyId);

    return (
        <div className="animate-in fade-in duration-300">
            <AgentBuilderForm companyId={companyUser.companyId} knowledgeBases={kbOptions} />
        </div>
    );
}
