import { PrismaClient } from "@prisma/client";
import { runWorkflow } from "../apps/web/lib/workflow-executor";

const prisma = new PrismaClient();

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyWorkflows() {
    console.log("🧪 [Verify] Iniciando prueba integral del motor de automatización...");

    // 1. Obtener el flujo de Triage (es el más completo porque usa IA, Branching y DB_Write)
    const triageWorkflow = await prisma.workflow.findFirst({
        where: { name: "🚨 Triage Omnicanal Inmediato" },
        include: { company: true }
    });

    if (!triageWorkflow) {
        console.error("❌ No se encontró el flujo de Triage en la base de datos.");
        process.exit(1);
    }

    console.log(`\n🏢 Empresa objetivo: ${triageWorkflow.company.name}`);
    console.log(`✅ Flujo a probar: ${triageWorkflow.name}`);

    // 2. Simular un payload de Webhook con alta urgencia
    console.log("\n🚀 Simulando un mensaje entrante de WhatsApp...");
    const simulatedTriggerData = {
        source: "WHATSAPP",
        content: "¡Hola! Estoy muy interesado en contratar sus servicios, lo necesito de urgencia para hoy mismo. Mi presupuesto es alto.",
        email: "test_urgente@placeholder.com"
    };

    const simulatedContactData = {
        name: "Test User Urgente",
        first_name: "Test",
        email: "test_urgente@placeholder.com",
        phone: "+1234567890"
    };

    console.log("Payload:", simulatedTriggerData.content);

    // Ensure agent exists
    const stepsArray = triageWorkflow.steps as any[];
    let agentId = stepsArray[0].config.agentId;
    let agent = await prisma.aIAgent.findUnique({ where: { id: agentId } });
    
    if (!agent) {
        console.log("⚠️ Agente de IA no encontrado. Creando uno temporal para la prueba...");
        agent = await prisma.aIAgent.create({
            data: {
                id: agentId,
                name: "Agent Triage Test",
                description: "Test Agent",
                systemPrompt: "Eres un agente clasificador. Responde URGENT si el usuario tiene urgencia.",
                companyId: triageWorkflow.companyId,
                llmModel: "gemini-2.0-flash"
            }
        });
        console.log("✅ Agente temporal creado.");
    }

    // 3. Ejecutar el Workflow
    console.log("\n⚙️ Disparando el motor de ejecución (DAG)...");
    
    // In real life, it's called asynchronously, but here we await it to trace logs
    const result = await runWorkflow(
        triageWorkflow.id,
        {
            ...simulatedTriggerData,
            contact: simulatedContactData
        }
    );

    if (!result.success || !result.executionId) {
        console.error("❌ Falla al inicializar ejecución:", result.error);
        process.exit(1);
    }
    
    const executionId = result.executionId;
    console.log(`✅ Ejecución inicializada con ID: ${executionId}`);

    // 4. Monitorear el progreso
    console.log("\n⏳ Monitoreando estado de la ejecución...");
    
    let isFinished = false;
    let maxRetries = 20; // 40 seconds max
    let retries = 0;

    while (!isFinished && retries < maxRetries) {
        await delay(2000);
        const execution = await prisma.workflowExecution.findUnique({
            where: { id: executionId }
        });

        if (!execution) break;

        process.stdout.write(`\rEstado actual: [${execution.status}] - Paso: ${execution.currentStep}`);

        if (["SUCCESS", "FAILED", "WAITING"].includes(execution.status)) {
            console.log(`\n\n🎉 Ejecución finalizada con estado: ${execution.status}`);
            
            console.log("\n📊 Historial de Pasos Ejecutados (Logs):");
            const logs = Array.isArray(execution.logs) ? execution.logs : [];
            logs.forEach((log: any) => {
                const icon = log.status === "SUCCESS" ? "🟢" : (log.status === "FAILED" ? "🔴" : "⚪");
                console.log(`${icon} Nodo: ${log.nodeId} (${log.type}) | Duración: ${log.durationMs}ms`);
                if (log.error) {
                    console.error(`   Error: ${log.error}`);
                }
            });

            // If it reached DB_WRITE, let's verify if the Deal was actually created
            if (execution.status === "SUCCESS" && logs.some((l: any) => l.type === "DB_WRITE")) {
                console.log("\n🔍 Verificando creación de Deal en la base de datos...");
                const newDeal = await prisma.deal.findFirst({
                    where: { 
                        title: { contains: "Test" },
                        companyId: triageWorkflow.companyId
                    },
                    orderBy: { createdAt: 'desc' }
                });

                if (newDeal) {
                    console.log(`✅ Deal encontrado: "${newDeal.title}" en etapa ${newDeal.stage}`);
                } else {
                    console.log("❌ No se encontró el Deal en la base de datos.");
                }
            }

            isFinished = true;
        }

        retries++;
    }

    if (!isFinished) {
        console.log("\n⚠️ La ejecución tomó demasiado tiempo o quedó estancada en RUNNING.");
    }
}

if (require.main === module) {
    verifyWorkflows()
        .then(() => {
            console.log("\n🏁 Prueba completada.");
            process.exit(0);
        })
        .catch(console.error);
}
