import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runConfigTest() {
    console.log("🚀 Iniciando Test de Integración de Configuración de Agentes (Specializations, Skills & RAG)...");

    // 1. Obtener o crear una empresa de prueba
    let company = await prisma.company.findFirst({
        where: { slug: "test-config-company" }
    });
    if (!company) {
        company = await prisma.company.create({
            data: {
                name: "Test Config Company",
                slug: "test-config-company"
            }
        });
        console.log(`✅ Empresa de prueba creada: ${company.id}`);
    } else {
        console.log(`ℹ️ Empresa de prueba existente localizada: ${company.id}`);
    }

    // 2. Crear una Especialización de prueba
    const spec = await prisma.agentSpecialization.create({
        data: {
            name: "Test Sales Spec",
            description: "Especialización de prueba para ventas",
            category: "SALES",
            icon: "target",
            color: "#0d9488",
            companyId: company.id
        }
    });
    console.log(`✅ Especialización creada: ${spec.name} (ID: ${spec.id})`);

    // 3. Crear Habilidades de prueba vinculadas a la especialización
    const skill1 = await prisma.agentSkill.create({
        data: {
            name: "Manejo de Objeciones (Test)",
            description: "Habilidad para manejar objeciones comunes",
            category: "COMMUNICATION",
            specializationId: spec.id,
            companyId: company.id,
            priority: 1
        }
    });
    const skill2 = await prisma.agentSkill.create({
        data: {
            name: "Cierre Rápido (Test)",
            description: "Habilidad para acelerar cierres de tratos",
            category: "NEGOTIATION",
            specializationId: spec.id,
            companyId: company.id,
            priority: 2
        }
    });
    console.log(`✅ Habilidades creadas:`);
    console.log(`   - ${skill1.name} (ID: ${skill1.id})`);
    console.log(`   - ${skill2.name} (ID: ${skill2.id})`);

    // 4. Crear Base de Conocimiento de prueba
    const kb = await prisma.knowledgeBase.create({
        data: {
            name: "Test RAG KB",
            content: "Contenido de prueba para el motor RAG de agentes.",
            companyId: company.id
        }
    });
    console.log(`✅ Base de conocimiento RAG creada: ${kb.name} (ID: ${kb.id})`);

    try {
        // 5. Test de CREACIÓN de AIAgent con Habilidades y KB
        console.log("\n🧪 1. Creando Agente vinculando Habilidades y Base de Conocimiento...");
        const newAgent = await prisma.aIAgent.create({
            data: {
                companyId: company.id,
                name: "Agente Integrado Test",
                systemPrompt: "Eres un agente de prueba.",
                llmModel: "gemini-2.0-flash",
                temperature: 0.4,
                maxTokens: 400,
                enabledTools: ["web_search"],
                isActive: true,
                knowledgeBases: { connect: [{ id: kb.id }] },
                agentSkills: { connect: [{ id: skill1.id }, { id: skill2.id }] }
            },
            include: {
                knowledgeBases: true,
                agentSkills: true
            }
        });

        console.log("👉 Agente creado en DB:");
        console.log(`   Nombre: ${newAgent.name}`);
        console.log(`   KB vinculadas: ${newAgent.knowledgeBases.map(k => k.name).join(", ")}`);
        console.log(`   Habilidades vinculadas: ${newAgent.agentSkills.map(s => s.name).join(", ")}`);

        if (newAgent.agentSkills.length !== 2) {
            throw new Error(`❌ Error: Se esperaban 2 habilidades asociadas, se obtuvieron ${newAgent.agentSkills.length}`);
        }
        if (newAgent.knowledgeBases.length !== 1) {
            throw new Error(`❌ Error: Se esperaba 1 KB asociada, se obtuvo ${newAgent.knowledgeBases.length}`);
        }
        console.log("🎯 Criterio de Creación Exitoso.");

        // 6. Test de ACTUALIZACIÓN de AIAgent (Remover una habilidad e incluir la otra)
        console.log("\n🧪 2. Actualizando Agente (desvinculando una habilidad)...");
        const updatedAgent = await prisma.aIAgent.update({
            where: { id: newAgent.id },
            data: {
                name: "Agente Integrado Test - Actualizado",
                agentSkills: { set: [{ id: skill1.id }] } // Solo dejamos la primera habilidad
            },
            include: {
                knowledgeBases: true,
                agentSkills: true
            }
        });

        console.log("👉 Agente actualizado en DB:");
        console.log(`   Nombre: ${updatedAgent.name}`);
        console.log(`   Habilidades vinculadas después de set: ${updatedAgent.agentSkills.map(s => s.name).join(", ")}`);

        if (updatedAgent.agentSkills.length !== 1) {
            throw new Error(`❌ Error: Se esperaba 1 habilidad asociada tras el update, se obtuvieron ${updatedAgent.agentSkills.length}`);
        }
        if (updatedAgent.agentSkills[0].id !== skill1.id) {
            throw new Error("❌ Error: La habilidad vinculada no es la esperada.");
        }
        console.log("🎯 Criterio de Actualización Exitoso.");

        // 7. Test de getAIAgentById equivalente
        console.log("\n🧪 3. Verificando lectura por ID con include completo...");
        const retrievedAgent = await prisma.aIAgent.findUnique({
            where: { id: newAgent.id },
            include: {
                knowledgeBases: true,
                agentSkills: true
            }
        });
        if (!retrievedAgent) throw new Error("No se pudo recuperar el agente.");
        console.log(`   Nombre recuperado: ${retrievedAgent.name}`);
        console.log(`   Habilidades recuperadas: ${retrievedAgent.agentSkills.map(s => s.name).join(", ")}`);
        
        // Limpieza de agente de prueba
        await prisma.aIAgent.delete({ where: { id: newAgent.id } });
        console.log("\n🧹 Limpiado agente de prueba.");

    } finally {
        // Limpieza final de entidades auxiliares de prueba (deleteMany no lanza error si no existen)
        await prisma.agentSkill.deleteMany({
            where: { id: { in: [skill1.id, skill2.id] } }
        });
        await prisma.agentSpecialization.deleteMany({
            where: { id: spec.id }
        });
        await prisma.knowledgeBase.deleteMany({
            where: { id: kb.id }
        });
        console.log("🧹 Limpiadas habilidades, especializaciones y KB de prueba.");
    }

    console.log("\n✅ ¡Todos los tests de conectividad a la base de datos pasaron exitosamente!");
}

runConfigTest()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
