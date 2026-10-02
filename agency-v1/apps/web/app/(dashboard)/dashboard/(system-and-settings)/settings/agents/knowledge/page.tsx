import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { KnowledgeBaseManager } from "@/components/settings/knowledge-base-manager";

export const dynamic = 'force-dynamic';

export default async function KnowledgeBasePage() {
    const session = await auth();
    if (!session || !session.user) redirect("/auth/login");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) redirect("/dashboard");

    // Fetch existing bases
    const bases = await prisma.knowledgeBase.findMany({
        where: { companyId: companyUser.companyId },
        include: { _count: { select: { agents: true } } },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="animate-in fade-in duration-300 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <KnowledgeBaseManager 
                companyId={companyUser.companyId} 
                initialData={bases as any} 
            />
        </div>
    );
}
