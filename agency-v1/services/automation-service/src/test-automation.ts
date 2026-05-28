import { prisma } from "@agency/database";
import { executeWorkflow } from "./workflow-executor";
import dotenv from "dotenv";
import path from "path";

// Load configuration from apps/web/.env.local
dotenv.config({ path: path.resolve(__dirname, "../../../apps/web/.env.local") });

// Ensure POSTGRES_EXTERNAL_URL is set for Prisma
if (process.env.DATABASE_URL && !process.env.POSTGRES_EXTERNAL_URL) {
  process.env.POSTGRES_EXTERNAL_URL = process.env.DATABASE_URL;
}

async function testAutomation() {
  console.log("\n========================================================");
  console.log("   INICIANDO TEST INTEGRAL DE AUTOMATIZACIÓN (DAG)");
  console.log("========================================================\n");

  const testSuffix = Date.now().toString().slice(-6);
  
  let companyId = "";
  let userId = "";
  let dealId = "";
  let workflowId = "";

  try {
    // 1. Crear empresa de prueba
    console.log("-> Creando Empresa de prueba...");
    const company = await prisma.company.create({
      data: {
        name: `TEST-AUTO-Co-${testSuffix}`,
        slug: `test-auto-slug-${testSuffix}`,
      }
    });
    companyId = company.id;
    console.log(`   [OK] Empresa creada: ${company.name} (ID: ${companyId})`);

    // 2. Crear usuario de prueba
    console.log("-> Creando Agente/Usuario de prueba...");
    const user = await prisma.user.create({
      data: {
        name: `Test Auto Agent ${testSuffix}`,
        email: `agent-auto-${testSuffix}@test.com`,
        role: "client_admin",
      }
    });
    userId = user.id;
    console.log(`   [OK] Usuario creado: ${user.name} (ID: ${userId})`);

    // 3. Crear negocio (Deal) de prueba
    console.log("-> Creando Negocio (Deal) de prueba...");
    const deal = await prisma.deal.create({
      data: {
        title: `Test Auto Deal ${testSuffix}`,
        stage: "CONTACTED",
        priority: "MEDIUM",
        companyId: companyId,
      } as any // Use any if type schema has other optional/required relations
    });
    dealId = deal.id;
    console.log(`   [OK] Deal creado: ${deal.title} (ID: ${dealId})`);

    // 4. Crear Workflow con estructura DAG
    console.log("-> Creando Workflow DAG de prueba...");
    
    const stepsDag = {
      nodes: [
        { id: "start", type: "triggerNode", data: { label: "Start Trigger" } },
        { id: "check_score", type: "conditionNode", data: { variable: "score", operator: "gt", conditionValue: "50" } },
        { 
          id: "task_high", 
          type: "actionNode", 
          data: { 
            actionType: "CREATE_TASK", 
            title: "Revisar lead caliente: {{name}} (Score: {{score}})", 
            priority: "HIGH",
            assignedTo: userId
          } 
        },
        { 
          id: "notify_low", 
          type: "actionNode", 
          data: { 
            actionType: "SEND_NOTIFICATION", 
            title: "Score regular para {{name}}", 
            message: "Score actual: {{score}}",
            userId: userId
          } 
        },
        {
          id: "update_deal_high",
          type: "actionNode",
          data: {
            actionType: "UPDATE_DEAL",
            stage: "QUALIFIED",
            priority: "HIGH"
          }
        }
      ],
      edges: [
        { id: "e1", source: "start", target: "check_score" },
        { id: "e2", source: "check_score", target: "task_high", sourceHandle: "true" },
        { id: "e3", source: "check_score", target: "notify_low", sourceHandle: "false" },
        { id: "e4", source: "task_high", target: "update_deal_high" }
      ]
    };

    const workflow = await prisma.workflow.create({
      data: {
        companyId,
        name: `Test DAG Automation ${testSuffix}`,
        triggerType: "CUSTOM_TRIGGER",
        triggerConfig: {},
        isActive: true,
        steps: stepsDag as any
      }
    });
    workflowId = workflow.id;
    console.log(`   [OK] Workflow DAG creado: ${workflow.name} (ID: ${workflowId})`);

    // =========================================================================
    // CASOS DE PRUEBA
    // =========================================================================
    console.log("\n--------------------------------------------------------");
    console.log(" EJECUTANDO CASOS DE PRUEBA EN EL MOTOR DAG");
    console.log("--------------------------------------------------------\n");

    // --- CASO 1: Score > 50 (Debe ir por rama TRUE, crear tarea alta y actualizar negocio) ---
    console.log(">> Caso de Prueba 1: Score alto (80) -> Rama TRUE");
    const context1 = {
      name: "Juan Perez",
      score: 80,
      __assignedTo: userId,
      __dealId: dealId
    };

    await executeWorkflow(workflowId, context1);
    
    // Obtener la ejecución
    const execution1 = await prisma.workflowExecution.findFirst({
      where: { workflowId },
      orderBy: { startedAt: 'desc' }
    });

    console.log(`   Estado de la ejecución: ${execution1?.status}`);
    const logs1 = (execution1?.logs as any[]) || [];
    console.log(`   Nodos ejecutados: ${logs1.map(l => `${l.nodeId} (${l.status})`).join(" -> ")}`);
    
    // Validaciones del Caso 1
    if (execution1?.status !== "SUCCESS") {
      throw new Error(`ERROR: La ejecución 1 falló con estado ${execution1?.status}`);
    }
    const visitedNodeIds1 = logs1.map(l => l.nodeId);
    if (!visitedNodeIds1.includes("task_high")) {
      throw new Error("ERROR: La ejecución 1 no ejecutó el nodo 'task_high' en la rama true.");
    }
    if (!visitedNodeIds1.includes("update_deal_high")) {
      throw new Error("ERROR: La ejecución 1 no ejecutó el nodo 'update_deal_high'.");
    }
    if (visitedNodeIds1.includes("notify_low")) {
      throw new Error("ERROR: La ejecución 1 ejecutó erróneamente la rama false ('notify_low').");
    }
    
    // Verificar que el negocio se actualizó
    const updatedDeal = await prisma.deal.findUnique({ where: { id: dealId } });
    console.log(`   Estado del Deal: ${updatedDeal?.stage} (Esperado: QUALIFIED), Prioridad: ${updatedDeal?.priority} (Esperado: HIGH)`);
    if (updatedDeal?.stage !== "QUALIFIED" || updatedDeal?.priority !== "HIGH") {
      throw new Error("ERROR: El deal no fue actualizado correctamente por el actionNode.");
    }
    console.log("   ✅ [EXITO] Caso de Prueba 1 verificado correctamente.\n");

    // --- CASO 2: Score <= 50 (Debe ir por rama FALSE y enviar notificación) ---
    console.log(">> Caso de Prueba 2: Score bajo (30) -> Rama FALSE");
    const context2 = {
      name: "Maria Lopez",
      score: 30,
      __assignedTo: userId,
      __dealId: dealId
    };

    await executeWorkflow(workflowId, context2);

    const execution2 = await prisma.workflowExecution.findFirst({
      where: { workflowId },
      orderBy: { startedAt: 'desc' }
    });

    console.log(`   Estado de la ejecución: ${execution2?.status}`);
    const logs2 = (execution2?.logs as any[]) || [];
    console.log(`   Nodos ejecutados: ${logs2.map(l => `${l.nodeId} (${l.status})`).join(" -> ")}`);

    if (execution2?.status !== "SUCCESS") {
      throw new Error(`ERROR: La ejecución 2 falló con estado ${execution2?.status}`);
    }
    const visitedNodeIds2 = logs2.map(l => l.nodeId);
    if (!visitedNodeIds2.includes("notify_low")) {
      throw new Error("ERROR: La ejecución 2 no ejecutó el nodo 'notify_low' en la rama false.");
    }
    if (visitedNodeIds2.includes("task_high") || visitedNodeIds2.includes("update_deal_high")) {
      throw new Error("ERROR: La ejecución 2 ejecutó erróneamente nodos de la rama true.");
    }
    console.log("   ✅ [EXITO] Caso de Prueba 2 verificado correctamente.\n");

    console.log("========================================================");
    console.log(" 🎉 ¡TODAS LAS PRUEBAS DE AUTOMATIZACIÓN COMPLETADAS! 🎉");
    console.log(" El motor DAG y algoritmos de flujo funcionan al 100%.");
    console.log("========================================================\n");

  } catch (error) {
    console.error("\n❌ ERROR DURANTE LA EJECUCIÓN DEL TEST:\n", error);
    process.exit(1);
  } finally {
    console.log("-> Iniciando Limpieza de base de datos de pruebas...");
    try {
      if (companyId) {
        // Al borrar la empresa, CASCADE limpia relaciones en cascada
        await prisma.company.delete({
          where: { id: companyId }
        });
        console.log("   [OK] Empresa, workflows y ejecuciones eliminados.");
      }
      if (userId) {
        await prisma.user.delete({
          where: { id: userId }
        });
        console.log("   [OK] Agente de prueba eliminado.");
      }
      console.log("   [OK] Base de datos limpia.");
    } catch (cleanError) {
      console.error("   [ERROR] No se pudo limpiar la base de datos completamente:", cleanError);
    } finally {
      await prisma.$disconnect();
    }
  }
}

testAutomation();
