import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function seedAgencyWorkflows() {
    console.log("🌱 [Seed] Initiating Agency Workflows Setup...");

    const companies = await prisma.company.findMany({ select: { id: true, name: true } });

    if (companies.length === 0) {
        console.error("❌ No companies found in the database. Cannot seed workflows.");
        process.exit(1);
    }

    // Default Agent to assign (we will use a generic placeholder or find one)
    for (const company of companies) {
        console.log(`\n🏢 Generating workflows for company: ${company.name} (${company.id})`);

        // Find the main AI Agent for the company to bind to the workflows
        const mainAgent = await prisma.aIAgent.findFirst({
            where: { companyId: company.id, isActive: true },
            select: { id: true }
        });

        const agentId = mainAgent?.id || "placeholder-agent-id";

        // ─────────────────────────────────────────────────────────────────────────
        // FLUJO 1: TRIAGE OMNICANAL INMEDIATO
        // ─────────────────────────────────────────────────────────────────────────
        const flow1Steps = [
            {
                id: "step-1-ai-triage",
                type: "AI_AGENT",
                label: "Analizar Mensaje",
                config: {
                    agentId: agentId,
                    messageTemplate: "{{triggerData.content}}",
                    continueOnError: false
                },
                nextId: "step-2-branch-sentiment"
            },
            {
                id: "step-2-branch-sentiment",
                type: "BRANCH",
                label: "Enrutador de Sentimiento",
                config: {},
                branches: [
                    {
                        condition: { field: "ai_response.sentiment", operator: "eq", value: "URGENT" },
                        nextId: "step-3-notify-sales"
                    },
                    {
                        condition: { field: "ai_response.sentiment", operator: "eq", value: "POSITIVE" },
                        nextId: "step-3-notify-sales"
                    }
                ],
                // Default fallback if not urgent/positive (End of flow)
            },
            {
                id: "step-3-notify-sales",
                type: "NOTIFY",
                label: "Alerta Push a Ventas",
                config: {
                    userId: "admin", // Would dynamically map to a user ID in prod
                    title: "🔥 Nuevo Lead Caliente: {{contact.first_name}}",
                    message: "La IA detectó intención de compra. Interviene en el chat ahora.",
                    type: "WORKFLOW"
                },
                nextId: "step-4-create-deal"
            },
            {
                id: "step-4-create-deal",
                type: "DB_WRITE",
                label: "Crear Deal Automático",
                config: {
                    model: "deal",
                    operation: "create",
                    data: {
                        name: "Oportunidad de {{contact.first_name}}",
                        stage: "NEW",
                        value: 0
                    }
                }
            }
        ];

        // ─────────────────────────────────────────────────────────────────────────
        // FLUJO 2: ANTI-GHOSTING (Seguimiento Propuestas)
        // ─────────────────────────────────────────────────────────────────────────
        const flow2Steps = [
            {
                id: "step-1-wait-48h",
                type: "WAIT",
                label: "Pausar 48 Horas",
                config: { delayMinutes: 2880 }, // 48 * 60
                nextId: "step-2-ai-check-stage"
            },
            {
                id: "step-2-ai-check-stage",
                type: "AI_AGENT",
                label: "Validar Pipeline y Seguir",
                config: {
                    agentId: agentId,
                    messageTemplate: "Revisa usando tus herramientas si el lead {{contact.email}} sigue en la etapa PROPOSAL. Si ya está WON o LOST, ignora. Si sigue en PROPOSAL, mándale un correo muy corto y natural de seguimiento.",
                },
                nextId: "step-3-notify-sales"
            },
            {
                id: "step-3-notify-sales",
                type: "NOTIFY",
                label: "Log de Seguimiento",
                config: {
                    userId: "admin",
                    title: "🤖 Seguimiento automático enviado a {{contact.first_name}}",
                    message: "La IA contactó al cliente fantasma.",
                    type: "WORKFLOW"
                }
            }
        ];

        // ─────────────────────────────────────────────────────────────────────────
        // FLUJO 3: ONBOARDING VIP & NPS
        // ─────────────────────────────────────────────────────────────────────────
        const flow3Steps = [
            {
                id: "step-1-create-onboarding-task",
                type: "DB_WRITE",
                label: "Crear Tareas Operativas",
                config: {
                    model: "task", // Note: The schema might use kanbanTask, adjust if necessary
                    operation: "create",
                    data: {
                        title: "🟢 ONBOARDING: Solicitar Accesos para {{contact.company}}",
                        status: "TODO"
                    }
                },
                nextId: "step-2-wait-7d"
            },
            {
                id: "step-2-wait-7d",
                type: "WAIT",
                label: "Esperar a Cumplir Semana",
                config: { delayMinutes: 10080 }, // 7 * 24 * 60
                nextId: "step-3-nps-email"
            },
            {
                id: "step-3-nps-email",
                type: "AI_AGENT",
                label: "Envío NPS Semanal",
                config: {
                    agentId: agentId,
                    messageTemplate: "Usa tu herramienta send_email para enviarle a {{contact.email}} un mensaje súper breve y cálido preguntando cómo se ha sentido en su primera semana de trabajo con nosotros.",
                }
            }
        ];

        // Insert / Update in DB
        const flows = [
            {
                id: randomUUID(),
                name: "🚨 Triage Omnicanal Inmediato",
                description: "Calificación por IA de mensajes entrantes. Deriva a un humano y crea un Trato si hay intención de compra.",
                isActive: true,
                triggerType: "WEBHOOK",
                triggerConfig: { source: "all_channels" },
                steps: flow1Steps,
                companyId: company.id
            },
            {
                id: randomUUID(),
                name: "👻 Anti-Ghosting en Propuestas",
                description: "Espera 48h tras enviar una propuesta. Si no han contestado, la IA les envía un amable correo de seguimiento.",
                isActive: true,
                triggerType: "DB_UPDATE",
                triggerConfig: { model: "deal", field: "stage", value: "PROPOSAL" },
                steps: flow2Steps,
                companyId: company.id
            },
            {
                id: randomUUID(),
                name: "🌟 Onboarding VIP & NPS Semanal",
                description: "Automatiza la creación de tareas operativas al cerrar una venta y revisa su satisfacción a los 7 días.",
                isActive: true,
                triggerType: "DB_UPDATE",
                triggerConfig: { model: "deal", field: "stage", value: "WON" },
                steps: flow3Steps,
                companyId: company.id
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
                    companyId: flow.companyId
                }
            });
            console.log(`✅ Inserted Workflow: ${flow.name}`);
        }
    }

    console.log("\n🎉 All 3 Master Workflows have been seeded successfully!");
}

if (require.main === module) {
    seedAgencyWorkflows()
        .catch((e) => {
            console.error(e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
