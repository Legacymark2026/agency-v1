import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import WorkflowEngineClient from "./workflow-client";

export default async function AutomationPage() {
    const { companyId } = await requireTenant(true);
    
    const workflows = await prisma.workflow.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' }
    });
    
    return <WorkflowEngineClient initialWorkflows={workflows} />;
}
