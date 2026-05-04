const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Workflow Templates...");

    const templates = [
        {
            name: "Bienvenida WhatsApp IA",
            description: "Responde automáticamente usando IA a todos los mensajes entrantes de WhatsApp.",
            isTemplate: true,
            triggerType: "WHATSAPP_MESSAGE",
            triggerConfig: {},
            steps: [
                {
                    id: "node-1",
                    type: "ai_agent",
                    config: { prompt: "Eres un asistente virtual amable. Saluda al cliente y pregúntale cómo puedes ayudarlo hoy.", provider: "openai" }
                },
                {
                    id: "node-2",
                    type: "action",
                    config: { actionType: "SEND_WHATSAPP" }
                }
            ],
            category: "Atención al Cliente"
        },
        {
            name: "Calificación de Leads (Ventas)",
            description: "Crea una tarea en el CRM cuando un lead se registra en un formulario de Meta.",
            isTemplate: true,
            triggerType: "META_LEAD",
            triggerConfig: {},
            steps: [
                {
                    id: "node-1",
                    type: "action",
                    config: { actionType: "CREATE_TASK", title: "Contactar a nuevo Lead VIP", priority: "HIGH" }
                }
            ],
            category: "Ventas"
        }
    ];

    for (const t of templates) {
        const existing = await prisma.workflow.findFirst({
            where: { isTemplate: true, name: t.name, companyId: null }
        });

        if (!existing) {
            await prisma.workflow.create({
                data: {
                    name: t.name,
                    description: t.description,
                    isTemplate: true,
                    triggerType: t.triggerType,
                    triggerConfig: t.triggerConfig,
                    steps: t.steps,
                    category: t.category,
                    companyId: null // Plantilla Global
                }
            });
            console.log(`Created template: ${t.name}`);
        } else {
            console.log(`Template already exists: ${t.name}`);
        }
    }

    console.log("Seeding done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
