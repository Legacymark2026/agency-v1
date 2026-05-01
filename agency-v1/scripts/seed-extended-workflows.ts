import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function seedExtendedWorkflows() {
    console.log("🌱 [Seed] Initiating Extended 15-Workflow Agency Setup...");

    const companies = await prisma.company.findMany({ select: { id: true, name: true } });

    if (companies.length === 0) {
        console.error("❌ No companies found in the database. Cannot seed workflows.");
        process.exit(1);
    }

    for (const company of companies) {
        console.log(`\n🏢 Seeding 15 extended workflows for company: ${company.name}`);

        const mainAgent = await prisma.aIAgent.findFirst({
            where: { companyId: company.id, isActive: true },
            select: { id: true }
        });
        const agentId = mainAgent?.id || "placeholder-agent-id";

        const flows = [
            // 🟢 A. Ventas y Captación (Lead Generation & Sales)
            {
                id: randomUUID(),
                name: "❄️ Reactivación de Leads Congelados",
                description: "Si un Deal lleva perdido 90 días, la IA envía un caso de éxito para reabrirlo.",
                isActive: true,
                triggerType: "DB_UPDATE",
                triggerConfig: { model: "deal", field: "stage", value: "LOST" },
                steps: [
                    { id: "step-1", type: "WAIT", config: { delayMinutes: 129600 }, nextId: "step-2" }, // 90 days
                    { id: "step-2", type: "AI_AGENT", config: { agentId, messageTemplate: "Revisa si {{contact.email}} sigue LOST. Si es así, envíale un correo preguntando si están listos para retomar, junto con un breve caso de éxito de la agencia." } }
                ]
            },
            {
                id: randomUUID(),
                name: "📅 Recuperación de Citas No-Show",
                description: "Si un evento es No-Show, la IA envía un mensaje para reagendar.",
                isActive: true,
                triggerType: "WEBHOOK", // Imagining a calendar webhook
                triggerConfig: { source: "calendar", event: "no_show" },
                steps: [
                    { id: "step-1", type: "AI_AGENT", config: { agentId, messageTemplate: "El prospecto {{triggerData.email}} no asistió a la cita. Envíale un correo comprensivo diciendo que entendemos que hubo contratiempos, y ofrécele reagendar amablemente." }, nextId: "step-2" },
                    { id: "step-2", type: "NOTIFY", config: { userId: "admin", title: "Cita Perdida: {{triggerData.email}}", message: "La IA ya envió solicitud para reagendar.", type: "WORKFLOW" } }
                ]
            },
            {
                id: randomUUID(),
                name: "🔥 Escalamiento de Leads Calientes (Score > 80)",
                description: "Notifica a ventas VIP si un lead cruza el umbral de 80 puntos.",
                isActive: true,
                triggerType: "DB_UPDATE",
                triggerConfig: { model: "lead", field: "score", condition: ">", value: 80 },
                steps: [
                    { id: "step-1", type: "NOTIFY", config: { userId: "admin", title: "🚨 Lead VIP Caliente: {{contact.name}}", message: "Este lead superó los 80 puntos. Interviene inmediatamente para cierre.", type: "URGENT" } }
                ]
            },
            {
                id: randomUUID(),
                name: "✍️ Alerta de Contrato Pendiente",
                description: "Recuerda al cliente firmar el contrato a los 3 días de enviado.",
                isActive: true,
                triggerType: "DB_UPDATE",
                triggerConfig: { model: "deal", field: "stage", value: "CONTRACT_SENT" },
                steps: [
                    { id: "step-1", type: "WAIT", config: { delayMinutes: 4320 }, nextId: "step-2" }, // 3 days
                    { id: "step-2", type: "AI_AGENT", config: { agentId, messageTemplate: "Revisa si el trato de {{contact.email}} sigue en CONTRACT_SENT. Si es así, envíale un recordatorio muy amable para que nos regrese el documento firmado." } }
                ]
            },
            {
                id: randomUUID(),
                name: "💔 Encuesta de Salida (Lost Deal)",
                description: "Pide feedback corto a los tratos perdidos.",
                isActive: true,
                triggerType: "DB_UPDATE",
                triggerConfig: { model: "deal", field: "stage", value: "LOST" },
                steps: [
                    { id: "step-1", type: "WAIT", config: { delayMinutes: 2880 }, nextId: "step-2" }, // 2 days
                    { id: "step-2", type: "AI_AGENT", config: { agentId, messageTemplate: "Usa send_email para preguntarle a {{contact.email}} cortésmente: ¿Hubo algo en específico que no te convenció de nuestra propuesta? Esto nos ayudará a mejorar." } }
                ]
            },

            // 🔵 B. Operaciones y Servicio al Cliente (Fulfillment)
            {
                id: randomUUID(),
                name: "🔑 Solicitud de Accesos (Client Onboarding)",
                description: "Bucle para solicitar credenciales al cliente al pasar a Onboarding.",
                isActive: true,
                triggerType: "DB_UPDATE",
                triggerConfig: { model: "deal", field: "stage", value: "ONBOARDING" },
                steps: [
                    { id: "step-1", type: "AI_AGENT", config: { agentId, messageTemplate: "Envíale un correo a {{contact.email}} solicitando los accesos a sus cuentas de Meta Ads y Google Analytics." }, nextId: "step-2" },
                    { id: "step-2", type: "WAIT", config: { delayMinutes: 4320 }, nextId: "step-3" }, // 3 days
                    { id: "step-3", type: "AI_AGENT", config: { agentId, messageTemplate: "Revisa el historial. Si el cliente no ha enviado los accesos, envíale un recordatorio educado diciendo que los necesitamos para arrancar su campaña." } }
                ]
            },
            {
                id: randomUUID(),
                name: "🩺 Control de Calidad a Medio Proyecto",
                description: "Manda un check-in de calidad cuando una tarea principal se completa.",
                isActive: true,
                triggerType: "DB_UPDATE",
                triggerConfig: { model: "task", field: "status", value: "DONE", taskNameContains: "Desarrollo" },
                steps: [
                    { id: "step-1", type: "AI_AGENT", config: { agentId, messageTemplate: "Envíale un correo a {{contact.email}} diciendo que vamos a la mitad de su proyecto, y queremos saber si hasta el momento está satisfecho con nuestra comunicación y trabajo." } }
                ]
            },
            {
                id: randomUUID(),
                name: "🚀 Upsell Post-Lanzamiento",
                description: "Ofrece servicios adicionales a los 30 días de entregar el proyecto.",
                isActive: true,
                triggerType: "DB_UPDATE",
                triggerConfig: { model: "deal", field: "stage", value: "COMPLETED" },
                steps: [
                    { id: "step-1", type: "WAIT", config: { delayMinutes: 43200 }, nextId: "step-2" }, // 30 days
                    { id: "step-2", type: "AI_AGENT", config: { agentId, messageTemplate: "Han pasado 30 días desde que terminamos el proyecto de {{contact.company}}. Envíales un correo proponiendo una reunión corta para hablar de estrategias de crecimiento complementarias (Upsell)." } }
                ]
            },
            {
                id: randomUUID(),
                name: "🍾 Celebración Interna (Deal Won)",
                description: "Notifica a todo el equipo cuando se cierra una venta grande.",
                isActive: true,
                triggerType: "DB_UPDATE",
                triggerConfig: { model: "deal", field: "stage", value: "WON" },
                steps: [
                    { id: "step-1", type: "NOTIFY", config: { userId: "all", title: "🎉 ¡NUEVO CLIENTE CERRADO!", message: "El trato de {{contact.company}} se ha cerrado con éxito. ¡Gran trabajo a todo el equipo de ventas!", type: "ANNOUNCEMENT" } }
                ]
            },

            // 🟠 C. Retención y Manejo de Crisis
            {
                id: randomUUID(),
                name: "💣 Prevención de Abandono (Churn Risk)",
                description: "Avisa a gerencia si la IA detecta sentimiento negativo.",
                isActive: true,
                triggerType: "DB_UPDATE", // In reality, this might be triggered directly from route.ts, but we map it conceptually
                triggerConfig: { model: "conversation", field: "sentiment", value: "NEGATIVE" },
                steps: [
                    { id: "step-1", type: "NOTIFY", config: { userId: "admin", title: "⚠️ RIESGO DE CHURN: {{contact.company}}", message: "La IA detectó frustración o enojo en el último mensaje de este cliente. Intervención manual requerida ahora.", type: "URGENT" } }
                ]
            },
            {
                id: randomUUID(),
                name: "♻️ Alerta de Renovación",
                description: "Avise 7 días antes de la renovación anual de suscripción.",
                isActive: true,
                triggerType: "WEBHOOK", // From Stripe billing system
                triggerConfig: { source: "billing", event: "subscription.upcoming" },
                steps: [
                    { id: "step-1", type: "AI_AGENT", config: { agentId, messageTemplate: "La suscripción anual de {{triggerData.company}} se renovará en 7 días. Envíales un correo agradeciendo su lealtad y ofreciendo agendar una llamada de revisión de métricas." }, nextId: "step-2" },
                    { id: "step-2", type: "NOTIFY", config: { userId: "admin", title: "Renovación inminente: {{triggerData.company}}", message: "La cuenta renovará en 7 días.", type: "WORKFLOW" } }
                ]
            },
            {
                id: randomUUID(),
                name: "⭐ Solicitud de Reseña en Google",
                description: "Pide una reseña pública cuando NPS es positivo.",
                isActive: true,
                triggerType: "WEBHOOK", // From NPS tool
                triggerConfig: { source: "nps", score: "> 8" },
                steps: [
                    { id: "step-1", type: "AI_AGENT", config: { agentId, messageTemplate: "El cliente de {{contact.email}} nos calificó con un 9/10. Envíale un correo agradeciendo y pidiéndole amablemente si podría dejarnos una reseña de 5 estrellas en Google Maps. Incluye un link de ejemplo." } }
                ]
            },

            // 🔴 D. Administración y Cobranza
            {
                id: randomUUID(),
                name: "💸 Cobrador Automático Amable",
                description: "Manda un recordatorio de pago a las facturas vencidas.",
                isActive: true,
                triggerType: "DB_UPDATE",
                triggerConfig: { model: "lead", field: "tags", contains: "invoice-overdue" },
                steps: [
                    { id: "step-1", type: "AI_AGENT", config: { agentId, messageTemplate: "Usa send_email para avisarle al cliente {{contact.email}} que nuestro sistema contable muestra una factura pendiente de pago. Sé extremadamente profesional y dales el beneficio de la duda." }, nextId: "step-2" },
                    { id: "step-2", type: "NOTIFY", config: { userId: "admin", title: "Factura Vencida Seguimiento", message: "Cobranza enviada a {{contact.company}}.", type: "WORKFLOW" } }
                ]
            },
            {
                id: randomUUID(),
                name: "👋 Offboarding y Salvamento",
                description: "Despedida automática con descuento de retorno a cuentas canceladas.",
                isActive: true,
                triggerType: "WEBHOOK",
                triggerConfig: { source: "billing", event: "subscription.deleted" },
                steps: [
                    { id: "step-1", type: "AI_AGENT", config: { agentId, messageTemplate: "El cliente {{contact.email}} canceló su suscripción. Envíale un correo de despedida lamentando su partida y ofrécele un cupón del 20% si decide volver en los próximos 6 meses." } }
                ]
            },
            {
                id: randomUUID(),
                name: "🚦 Alerta de Cuello de Botella Interno",
                description: "Escala tickets que lleven sin responderse más de 48 horas.",
                isActive: true,
                triggerType: "CRON", // Or simulated via DB state sweeping
                triggerConfig: { schedule: "0 9 * * *" },
                steps: [
                    // In a real flow, the backend cron reads stale tickets and fires this webhook per ticket
                    { id: "step-1", type: "NOTIFY", config: { userId: "admin", title: "🚨 CUELLO DE BOTELLA OPERATIVO", message: "La conversación de {{triggerData.contact}} lleva >48h sin respuesta. Reasígnala inmediatamente.", type: "URGENT" } }
                ]
            }
        ];

        for (const flow of flows) {
            await prisma.workflow.create({
                data: {
                    id: flow.id,
                    name: flow.name,
                    description: flow.description,
                    isActive: flow.isActive,
                    triggerType: flow.triggerType,
                    triggerConfig: flow.triggerConfig,
                    steps: flow.steps,
                    companyId: company.id
                }
            });
            console.log(`✅ Inserted Workflow: ${flow.name}`);
        }
    }

    console.log("\n🎉 All 15 Extended Enterprise Workflows seeded successfully!");
}

if (require.main === module) {
    seedExtendedWorkflows()
        .catch((e) => {
            console.error(e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
