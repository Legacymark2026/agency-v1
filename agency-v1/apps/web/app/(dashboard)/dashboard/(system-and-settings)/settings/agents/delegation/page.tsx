import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import AgentDelegationClient from "./delegation-client";

export default async function DelegationPage() {
    const { companyId } = await requireTenant(true);
    
    const delegations = await prisma.agentDelegation.findMany({
        where: { companyId }
    });
    
    return <AgentDelegationClient delegations={delegations} />;
}
