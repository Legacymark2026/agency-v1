import { PrismaClient } from "@prisma/client";
import { triageAndRouteMessage } from "../lib/agent-runner";

const prisma = new PrismaClient();

async function runTest() {
    console.log("🚀 Iniciando Test Multimodal del Motor Ultra-Pro...");
    
    // 1. Encontrar el primer agente activo
    let agent = await prisma.aIAgent.findFirst({
        where: { isActive: true }
    });

    if (!agent) {
        console.log("⚠️ No se encontró ningún Agente, creando uno de prueba automáticamente...");
        
        let company = await prisma.company.findFirst();
        if (!company) {
            company = await prisma.company.create({
                data: { name: "Test Company" }
            });
        }
        
        agent = await prisma.aIAgent.create({
            data: {
                companyId: company.id,
                name: "Arquitecto de Relaciones Ultra-Pro (Test)",
                description: "Agente inyectado automáticamente para test",
                agentType: "SALES",
                systemPrompt: "Actúa como un agente con conciencia situacional absoluta. REGLA: Si detectes una brecha de tiempo mayor a 7 días en la fecha de última interacción {{last_interaction_date}} con {{contact.first_name}}, inicia saludando por el tiempo que no se ven. Si su mensaje contiene insultos, muestra mucha empatía y soporte.",
                frustrationThreshold: 0.6, // Bajo para activar fácilmente
                isActive: true
            }
        });
        console.log("✨ Agente de prueba inyectado correctamente.");
    }

    console.log(`\n✅ Agente localizado: "${agent.name}" (ID: ${agent.id})`);

    // 2. Mock de Contacto (Simulando Memoria Episódica > 7 días)
    const mockContact = {
        firstName: "Alejandro",
        dealStage: "Negociación Avanzada",
        lastInteraction: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Hace 10 días
        companyName: "Acme Corp"
    };

    console.log(`\n👨‍💼 Datos inyectados desde el "CRM virtual":`);
    console.table(mockContact);

    // 3. Prueba 1: Mensaje Normal (Memoria Episódica y Simulación TTS)
    const message1 = "Hola, soy Alejandro, retomando el tema de la otra vez.";
    console.log(`\n💬 Mensaje Usuario: "${message1}"`);
    console.log(`⚙️ Enviando a Gemini...`);
    
    console.time("⏱️  Tiempo de respuesta");
    const result1 = await triageAndRouteMessage(agent.companyId, message1, undefined, mockContact);
    console.timeEnd("⏱️  Tiempo de respuesta");
    
    console.log(`\n🤖 Respuesta del Agente:\n\x1b[36m${result1.result}\x1b[0m\n`);
    console.log(`📊 Score de Frustración: ${result1.sentimentScore?.toFixed(2)} | Tokens Consumidos: ${result1.tokensUsed}`);

    // 4. Prueba 2: Umbral de Frustración (Comportamiento de Crisis)
    console.log("\n-----------------------------------------------------------");
    const message2 = "Llevo días esperando, esto es inaceptable. Pésimo servicio, quiero cancelar mi suscripción y hablar con un humano YA.";
    console.log(`\n🤬 Mensaje Furioso: "${message2}"`);
    console.log(`⚙️ Evaluando Sentiment y Reglas de Suspensión...`);

    const result2 = await triageAndRouteMessage(agent.companyId, message2, undefined, mockContact);

    console.log(`\n🤖 Respuesta del Agente:\n\x1b[33m${result2.result}\x1b[0m\n`);
    
    if (result2.suspended) {
        console.log(`🚨 ¡PROTOCOLO DE SEGURIDAD ACTIVADO!`);
        console.log(`Razón de la suspensión: ${result2.suspendedReason}`);
        console.log(`Frustración detectada: ${result2.sentimentScore?.toFixed(2)} (Mayor al Umbral)`);
    } else {
        console.log(`ℹ️ El mensaje no alcanzó el umbral crítico de frustración (${result2.sentimentScore}).`);
    }
    
    console.log("\n✅ Suite de Pruebas finalizada con éxito.");
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
