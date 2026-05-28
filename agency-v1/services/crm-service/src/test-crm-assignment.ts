import { prisma } from "@agency/database";
import { routeLead } from "./assignment-engine";
import dotenv from "dotenv";
import path from "path";

// Load configuration from apps/web/.env.local so we connect to the real database
dotenv.config({ path: path.resolve(__dirname, "../../../apps/web/.env.local") });

// Ensure POSTGRES_EXTERNAL_URL is set for Prisma
if (process.env.DATABASE_URL && !process.env.POSTGRES_EXTERNAL_URL) {
  process.env.POSTGRES_EXTERNAL_URL = process.env.DATABASE_URL;
}

async function testEngine() {
  console.log("\n========================================================");
  console.log("   INICIANDO TEST INTEGRAL DE ASIGNACIÓN DE LEADS");
  console.log("========================================================\n");

  const testSuffix = Date.now().toString().slice(-6);
  
  // 1. Identificar entidades creadas para limpieza posterior
  const createdUserIds: string[] = [];
  let companyId = "";
  let teamId = "";

  try {
    // 2. Crear una Empresa de prueba
    console.log("-> Creando Empresa de prueba...");
    const company = await prisma.company.create({
      data: {
        name: `TEST-CRM-Co-${testSuffix}`,
        slug: `test-crm-slug-${testSuffix}`,
      }
    });
    companyId = company.id;
    console.log(`   [OK] Empresa creada: ${company.name} (ID: ${companyId})`);

    // 3. Crear 3 Usuarios/Agentes de prueba
    console.log("-> Creando Agentes de prueba...");
    const emails = [
      `agent-a-${testSuffix}@test.com`,
      `agent-b-${testSuffix}@test.com`,
      `agent-c-${testSuffix}@test.com`
    ];
    
    const agents: any[] = [];
    for (let i = 0; i < 3; i++) {
      const user = await prisma.user.create({
        data: {
          name: `Test Agent ${String.fromCharCode(65 + i)}`,
          email: emails[i],
          role: "client_admin", // rol estándar para pasar filtros
        }
      });
      createdUserIds.push(user.id);
      agents.push(user);
    }
    const [agentA, agentB, agentC] = agents;
    console.log(`   [OK] Agentes creados: ${agents.map(a => a.name).join(", ")}`);

    // 4. Crear un Equipo de prueba
    console.log("-> Creando Equipo de prueba...");
    const team = await prisma.team.create({
      data: {
        name: `Team-Specialized-FB-${testSuffix}`,
        companyId: companyId,
      }
    });
    teamId = team.id;
    console.log(`   [OK] Equipo creado: ${team.name} (ID: ${teamId})`);

    // 5. Vincular agentes a la empresa (CompanyUser) y asignar equipo a B y C
    console.log("-> Vinculando agentes al equipo y empresa...");
    // Agent A -> No tiene equipo (solo empresa)
    await prisma.companyUser.create({
      data: {
        companyId,
        userId: agentA.id,
      }
    });
    // Agent B -> Equipo FB
    await prisma.companyUser.create({
      data: {
        companyId,
        userId: agentB.id,
        teamId: teamId,
      }
    });
    // Agent C -> Equipo FB
    await prisma.companyUser.create({
      data: {
        companyId,
        userId: agentC.id,
        teamId: teamId,
      }
    });
    console.log("   [OK] Agentes vinculados exitosamente.");

    // 6. Crear Reglas de Asignación de Prueba
    console.log("-> Creando Reglas de Enrutamiento...");
    
    // Regla 1 (Prioridad 0): Leads de Facebook van al equipo FB mediante Round-Robin
    const rule1 = await (prisma as any).leadAssignmentRule.create({
      data: {
        companyId,
        name: "Rule 1 - FB Facebook Leads",
        priority: 0,
        isActive: true,
        conditions: JSON.stringify([{ field: "source", operator: "EQUALS", value: "facebook" }]),
        roundRobinEnabled: true,
        teamId: teamId,
      }
    });

    // Regla 2 (Prioridad 1): Leads de tipo Direct van directo al Agente A
    const rule2 = await (prisma as any).leadAssignmentRule.create({
      data: {
        companyId,
        name: "Rule 2 - Direct to Agent A",
        priority: 1,
        isActive: true,
        conditions: JSON.stringify([{ field: "source", operator: "EQUALS", value: "direct" }]),
        roundRobinEnabled: false,
        assignedUserId: agentA.id,
      }
    });

    // Regla 3 (Prioridad 2): Leads que contengan la palabra "web" en utmSource van a Round-Robin general de la empresa
    const rule3 = await (prisma as any).leadAssignmentRule.create({
      data: {
        companyId,
        name: "Rule 3 - Web UTM General",
        priority: 2,
        isActive: true,
        conditions: JSON.stringify([{ field: "utmSource", operator: "CONTAINS", value: "web" }]),
        roundRobinEnabled: true,
      }
    });

    console.log("   [OK] Reglas de enrutamiento creadas.");

    // =========================================================================
    // EJECUTANDO PRUEBAS
    // =========================================================================
    console.log("\n--------------------------------------------------------");
    console.log(" EJECUTANDO CASOS DE PRUEBA");
    console.log("--------------------------------------------------------\n");

    // --- CASO 1: Regla 1 matching (Round-Robin dentro del Equipo FB) ---
    // Agentes en el equipo FB: Agent B y Agent C. El round robin debe rotar entre ellos.
    console.log(">> Caso de Prueba 1: Leads de Facebook (Round-Robin de Equipo)");
    const leadFB1 = { companyId, source: "facebook" };
    const leadFB2 = { companyId, source: "facebook" };
    const leadFB3 = { companyId, source: "facebook" };

    const assignFB1 = await routeLead(leadFB1);
    const assignFB2 = await routeLead(leadFB2);
    const assignFB3 = await routeLead(leadFB3);

    console.log(`   Asignación 1 (Lead FB 1): ${assignFB1 === agentB.id ? "Agente B" : assignFB1 === agentC.id ? "Agente C" : "Desconocido"}`);
    console.log(`   Asignación 2 (Lead FB 2): ${assignFB2 === agentB.id ? "Agente B" : assignFB2 === agentC.id ? "Agente C" : "Desconocido"}`);
    console.log(`   Asignación 3 (Lead FB 3): ${assignFB3 === agentB.id ? "Agente B" : assignFB3 === agentC.id ? "Agente C" : "Desconocido"}`);

    if (!assignFB1 || !assignFB2 || !assignFB3) {
      throw new Error("ERROR: Algunas asignaciones del Caso 1 fueron nulas.");
    }
    if (assignFB1 === assignFB2) {
      throw new Error("ERROR: Round-robin de equipo no rotó entre los agentes.");
    }
    if (assignFB1 !== assignFB3) {
      throw new Error("ERROR: Round-robin de equipo no volvió a rotar al inicio en el tercer lead.");
    }
    console.log("   ✅ [EXITO] Caso de Prueba 1 verificado correctamente.\n");

    // --- CASO 2: Regla 2 matching (Asignación Directa) ---
    // Debe ir siempre al Agente A.
    console.log(">> Caso de Prueba 2: Leads Directos (Asignación Directa)");
    const leadDirect1 = { companyId, source: "direct" };
    const leadDirect2 = { companyId, source: "direct" };

    const assignDirect1 = await routeLead(leadDirect1);
    const assignDirect2 = await routeLead(leadDirect2);

    console.log(`   Asignación 1: ${assignDirect1 === agentA.id ? "Agente A (Correcto)" : "Incorrecto"}`);
    console.log(`   Asignación 2: ${assignDirect2 === agentA.id ? "Agente A (Correcto)" : "Incorrecto"}`);

    if (assignDirect1 !== agentA.id || assignDirect2 !== agentA.id) {
      throw new Error("ERROR: Asignación directa no redirigió correctamente al Agente A.");
    }
    console.log("   ✅ [EXITO] Caso de Prueba 2 verificado correctamente.\n");

    // --- CASO 3: Regla 3 matching (Round-Robin general de la Empresa) ---
    // Agentes en la empresa: Agent A, Agent B, Agent C. Debe rotar entre los 3 ordenados por ID (o alfabéticamente).
    console.log(">> Caso de Prueba 3: UTM Source 'web' (Round-Robin Global de Empresa)");
    const leadWeb1 = { companyId, utmSource: "web-google" };
    const leadWeb2 = { companyId, utmSource: "web-meta" };
    const leadWeb3 = { companyId, utmSource: "web-organic" };
    const leadWeb4 = { companyId, utmSource: "web-direct" };

    const assignWeb1 = await routeLead(leadWeb1);
    const assignWeb2 = await routeLead(leadWeb2);
    const assignWeb3 = await routeLead(leadWeb3);
    const assignWeb4 = await routeLead(leadWeb4);

    const getAgentName = (id: string | null) => {
      if (id === agentA.id) return "Agente A";
      if (id === agentB.id) return "Agente B";
      if (id === agentC.id) return "Agente C";
      return "Desconocido";
    };

    console.log(`   Asignación 1: ${getAgentName(assignWeb1)}`);
    console.log(`   Asignación 2: ${getAgentName(assignWeb2)}`);
    console.log(`   Asignación 3: ${getAgentName(assignWeb3)}`);
    console.log(`   Asignación 4: ${getAgentName(assignWeb4)}`);

    if (!assignWeb1 || !assignWeb2 || !assignWeb3 || !assignWeb4) {
      throw new Error("ERROR: Algunas asignaciones del Caso 3 fueron nulas.");
    }
    const webSet = new Set([assignWeb1, assignWeb2, assignWeb3]);
    if (webSet.size !== 3) {
      throw new Error("ERROR: El Round-Robin global no distribuyó entre los 3 agentes.");
    }
    if (assignWeb1 !== assignWeb4) {
      throw new Error("ERROR: El Round-Robin global no completó el ciclo de rotación.");
    }
    console.log("   ✅ [EXITO] Caso de Prueba 3 verificado correctamente.\n");

    // --- CASO 4: Fallback Global Round-Robin (Ninguna regla coincide) ---
    // Debe distribuir rotativamente entre todos los agentes de la empresa.
    console.log(">> Caso de Prueba 4: Lead sin reglas coincidentes (Fallback Global)");
    const leadFallback1 = { companyId, source: "unregistered-source" };
    const leadFallback2 = { companyId, source: "unregistered-source" };
    const leadFallback3 = { companyId, source: "unregistered-source" };

    const assignFall1 = await routeLead(leadFallback1);
    const assignFall2 = await routeLead(leadFallback2);
    const assignFall3 = await routeLead(leadFallback3);

    console.log(`   Asignación Fallback 1: ${getAgentName(assignFall1)}`);
    console.log(`   Asignación Fallback 2: ${getAgentName(assignFall2)}`);
    console.log(`   Asignación Fallback 3: ${getAgentName(assignFall3)}`);

    if (!assignFall1 || !assignFall2 || !assignFall3) {
      throw new Error("ERROR: Algunas asignaciones de fallback fueron nulas.");
    }
    const fallbackSet = new Set([assignFall1, assignFall2, assignFall3]);
    if (fallbackSet.size !== 3) {
      throw new Error("ERROR: El fallback global no rotó entre todos los agentes activos.");
    }
    console.log("   ✅ [EXITO] Caso de Prueba 4 verificado correctamente.\n");

    console.log("========================================================");
    console.log(" 🎉 ¡TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO! 🎉");
    console.log(" El motor de asignación cumple al 100% las reglas.");
    console.log("========================================================\n");

  } catch (error) {
    console.error("\n❌ ERROR DURANTE LA EJECUCIÓN DEL TEST:\n", error);
  } finally {
    // 9. LIMPIEZA DE BASE DE DATOS
    console.log("-> Iniciando Limpieza de base de datos de pruebas...");
    try {
      if (companyId) {
        // Al borrar la empresa, CASCADE eliminará reglas, estados de round robin, y vinculaciones de equipos.
        await prisma.company.delete({
          where: { id: companyId }
        });
        console.log("   [OK] Empresa, reglas y estados eliminados en cascada.");
      }

      // Eliminar los usuarios creados
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: {
            id: { in: createdUserIds }
          }
        });
        console.log("   [OK] Agentes de prueba eliminados.");
      }
      console.log("   [OK] Base de datos limpia.");
    } catch (cleanError) {
      console.error("   [ERROR] No se pudo limpiar la base de datos completamente:", cleanError);
    } finally {
      await prisma.$disconnect();
    }
  }
}

testEngine();
