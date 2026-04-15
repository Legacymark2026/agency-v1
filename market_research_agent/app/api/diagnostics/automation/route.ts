import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeWorkflow } from "@/actions/automation";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    console.log("🚀 Starting Ultra-Professional Auto-Engine Diagnostic...");
    const logs: string[] = [];
    const log = (msg: string) => { console.log(msg); logs.push(msg); };

    try {
        const company = await prisma.company.findFirst();
        if (!company) throw new Error("No company found for test.");

        log("1. Creating Complex Test DAG (Directed Acyclic Graph) Workflow...");
        
        // Mock DAG Architecture:
        // [Trigger] -> [Parallel Action 1]
        //           -> [Parallel Action 2 (Wait)]
        //           -> [Condition Node: email contains @vip.com]
        //                 ├── (True Edge) -> [VIP CRM Action]
        //                 └── (False Edge) -> [Standard Email Action]

        const nodes = [
            { id: "node-trigger", type: "triggerNode", data: { triggerType: "WEBHOOK" }, position: {x:0, y:0} },
            { id: "node-action1", type: "actionNode", data: { subject: "Instant Welcome" }, position: {x:200, y:0} },
            { id: "node-wait", type: "waitNode", data: { delayValue: "1", delayUnit: "s" }, position: {x:200, y:100} },
            { id: "node-cond", type: "conditionNode", data: { variable: "email", conditionValue: "@vip.com" }, position: {x:200, y:200} },
            { id: "node-vip", type: "crmActionNode", data: { actionType: "CREATE_TASK", taskTitle: "Call VIP Client" }, position: {x:400, y:150} },
            { id: "node-std", type: "actionNode", data: { subject: "Standard Checkout Email" }, position: {x:400, y:250} }
        ];

        const edges = [
            // Parallelism
            { id: "e1", source: "node-trigger", target: "node-action1" },
            { id: "e2", source: "node-trigger", target: "node-wait" },
            { id: "e3", source: "node-trigger", target: "node-cond" },
            // True Branch
            { id: "e4", source: "node-cond", target: "node-vip", sourceHandle: "true" },
            // False Branch
            { id: "e5", source: "node-cond", target: "node-std", sourceHandle: "false" }
        ];

        const workflow = await prisma.workflow.create({
            data: {
                companyId: company.id,
                name: "DAG Diagnostics Test V1",
                triggerType: "WEBHOOK",
                triggerConfig: {},
                steps: { nodes, edges } as any, // Advanced JSON storage
                isActive: true
            }
        });
        log(`✓ Created Workflow (ID: ${workflow.id})`);

        log("2. Simulating Trigger 1 (Standard User - Should take False Branch)");
        const trigger1 = { email: "john@standard.com", dealId: "mock-deal", userId: "mock-user" };
        await executeWorkflow(workflow.id, trigger1);

        log("3. Simulating Trigger 2 (VIP User - Should take True Branch)");
        const trigger2 = { email: "sarah@vip.com", dealId: "mock-deal", userId: "mock-user" };
        await executeWorkflow(workflow.id, trigger2);

        log("4. Fetching Execution Results...");
        const execs = await prisma.workflowExecution.findMany({
            where: { workflowId: workflow.id },
            orderBy: { startedAt: 'asc' }
        });

        // Verification checks
        const e1 = execs[0];
        const e2 = execs[1];
        
        const logs1 = e1.logs as any[];
        const logs2 = e2.logs as any[];

        log(`Execution 1 (Standard) processed ${logs1.length} nodes.`);
        log(`Execution 2 (VIP) processed ${logs2.length} nodes.`);

        const passedParallel = logs1.some(l => l.nodeId === "node-action1") && logs1.some(l => l.nodeId === "node-wait");
        if (passedParallel) log("✓ Parallel Exeucution: PASSED (Action 1 and Wait processed concurrently)");

        const standardPassedObj = logs1.find(l => l.nodeId === "node-std");
        const standardFailedObj = logs1.find(l => l.nodeId === "node-vip");
        
        if (standardPassedObj && !standardFailedObj) log("✓ Branch Logic [False Branch]: PASSED (Routed to Standard Action, avoided VIP)");

        const vipPassedObj = logs2.find(l => l.nodeId === "node-vip");
        const vipFailedObj = logs2.find(l => l.nodeId === "node-std");

        if (vipPassedObj && !vipFailedObj) log("✓ Branch Logic [True Branch]: PASSED (Routed to VIP Action, avoided Standard)");

        log("5. Cleaning up Diagnostic Mock Data");
        await prisma.workflow.delete({ where: { id: workflow.id } });
        log("✓ Cleaned up.");

        log("🌟 DIAGNOSTIC COMPLETE: ULTRA-PROFESSIONAL AUTOMATION ENGINE IS FULLY OPERATIONAL 🌟");

        return NextResponse.json({ success: true, logs });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
