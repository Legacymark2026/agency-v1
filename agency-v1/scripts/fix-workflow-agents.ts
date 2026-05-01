/**
 * scripts/fix-workflow-agents.ts
 * ─────────────────────────────────────────────────────────────
 * Vincula el agentId real (primer agente activo de la empresa)
 * a todos los workflows que tienen "placeholder-agent-id".
 * Ejecutar una sola vez después de crear el primer agente en el dashboard.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔧 Fixing workflow agent IDs...\n");

    const company = await prisma.company.findFirst({ select: { id: true, name: true } });
    if (!company) { console.error("❌ No company found"); process.exit(1); }

    const agent = await prisma.aIAgent.findFirst({
        where: { companyId: company.id, isActive: true },
        select: { id: true, name: true }
    });

    if (!agent) {
        console.error("❌ No active AI Agent found. Create one in /dashboard/admin/agent-config first.");
        process.exit(1);
    }

    console.log(`✅ Found agent: ${agent.name} (${agent.id})`);

    const workflows = await prisma.workflow.findMany({
        where: { companyId: company.id }
    });

    let fixed = 0;
    for (const wf of workflows) {
        const steps = wf.steps as any[];
        if (!Array.isArray(steps)) continue;

        let changed = false;
        const updatedSteps = steps.map((step: any) => {
            if (step.type === 'AI_AGENT' && step.config?.agentId === 'placeholder-agent-id') {
                changed = true;
                return { ...step, config: { ...step.config, agentId: agent.id } };
            }
            return step;
        });

        if (changed) {
            await prisma.workflow.update({
                where: { id: wf.id },
                data: { steps: updatedSteps }
            });
            console.log(`  ✅ Fixed: ${wf.name}`);
            fixed++;
        }
    }

    console.log(`\n🎉 Fixed ${fixed}/${workflows.length} workflows.`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
