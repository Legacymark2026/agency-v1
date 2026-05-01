/**
 * seed-master-workflows.ts
 * ─────────────────────────────────────────────────────────────
 * Siembra 6 flujos maestros con formato compatible con:
 * - workflow-executor.ts (runtime engine)
 * - builder/page.tsx (transformStepsToGraph visualizer)
 *
 * Formato WAIT: usa `delay` en segundos (NO delayMinutes)
 * Tipos válidos: AI_AGENT, WAIT, CONDITION, CREATE_TASK, UPDATE_DEAL, ACTION
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────
const min = (m: number) => m * 60;
const hrs = (h: number) => h * 3600;
const days = (d: number) => d * 86400;

async function main() {
    console.log("🌱 Seeding Master Workflows...\n");

    const company = await prisma.company.findFirst({ select: { id: true, name: true } });
    if (!company) { console.error("❌ No company found"); process.exit(1); }

    const agent = await prisma.aIAgent.findFirst({
        where: { companyId: company.id, isActive: true },
        select: { id: true }
    });
    const agentId = agent?.id ?? "no-agent";

    console.log(`🏢 Company: ${company.name}`);
    console.log(`🤖 Agent: ${agentId}\n`);

    // Borrar flujos anteriores para evitar duplicados
    await prisma.workflow.deleteMany({ where: { companyId: company.id } });
    console.log("🗑️  Cleared previous workflows\n");

    const flows = [

        // ─────────────────────────────────────────────────────
        // 1. TRIAGE OMNICANAL — Lead caliente → Deal + Notif
        // ─────────────────────────────────────────────────────
        {
            name: "🚨 Triage Omnicanal (WhatsApp → Deal)",
            description: "Analiza el intent del mensaje. Si hay urgencia, crea Deal y alerta al equipo.",
            isActive: true,
            triggerType: "WHATSAPP_TRIGGER",
            triggerConfig: { channel: "whatsapp", keyword: "*" },
            steps: [
                {
                    id: "s1",
                    type: "AI_AGENT",
                    config: {
                        agentId,
                        aiTask: "CLASSIFY_INTENT",
                        promptContext: "Clasifica el mensaje como URGENT, INTERESTED o SPAM. Responde SOLO con una de esas palabras.",
                        messageTemplate: "{{triggerData.content}}"
                    }
                },
                {
                    id: "s2",
                    type: "CONDITION",
                    config: {
                        variable: "ai_response",
                        operator: "contains",
                        value: "URGENT"
                    }
                },
                {
                    id: "s3",
                    type: "UPDATE_DEAL",
                    config: {
                        actionType: "UPDATE_DEAL",
                        dealStage: "NEW",
                        taskTitle: "Lead urgente de WhatsApp: {{triggerData.sender}}"
                    }
                }
            ]
        },

        // ─────────────────────────────────────────────────────
        // 2. ANTI-GHOSTING — 48h sin respuesta → follow-up IA
        // ─────────────────────────────────────────────────────
        {
            name: "👻 Anti-Ghosting Propuestas (48h)",
            description: "Cuando un deal llega a PROPOSAL, espera 48h. Si sigue ahí, la IA hace follow-up.",
            isActive: true,
            triggerType: "DEAL_STAGE_CHANGED",
            triggerConfig: { stage: "PROPOSAL" },
            steps: [
                {
                    id: "s1",
                    type: "WAIT",
                    delay: days(2),
                    config: {}
                },
                {
                    id: "s2",
                    type: "AI_AGENT",
                    config: {
                        agentId,
                        aiTask: "SEND_EMAIL",
                        promptContext: "Eres el asistente de ventas. Escribe un email corto, cálido y profesional de seguimiento. Menciona que enviamos una propuesta hace 2 días y queremos saber si tienen preguntas. NO uses plantillas robóticas.",
                        messageTemplate: "Contacto: {{triggerData.contactName}} | Empresa: {{triggerData.companyName}}"
                    }
                },
                {
                    id: "s3",
                    type: "CREATE_TASK",
                    config: {
                        actionType: "CREATE_TASK",
                        taskTitle: "✅ Follow-up automático enviado a {{triggerData.contactName}}",
                        priority: "LOW"
                    }
                }
            ]
        },

        // ─────────────────────────────────────────────────────
        // 3. ONBOARDING VIP — Deal WON → Tareas + NPS 7d
        // ─────────────────────────────────────────────────────
        {
            name: "🌟 Onboarding VIP + NPS (7 días)",
            description: "Al cerrar una venta, crea tareas operativas y revisa NPS a los 7 días.",
            isActive: true,
            triggerType: "DEAL_STAGE_CHANGED",
            triggerConfig: { stage: "WON" },
            steps: [
                {
                    id: "s1",
                    type: "CREATE_TASK",
                    config: {
                        actionType: "CREATE_TASK",
                        taskTitle: "🔑 Onboarding: Solicitar accesos a {{triggerData.companyName}}",
                        priority: "HIGH"
                    }
                },
                {
                    id: "s2",
                    type: "WAIT",
                    delay: days(7),
                    config: {}
                },
                {
                    id: "s3",
                    type: "AI_AGENT",
                    config: {
                        agentId,
                        aiTask: "SEND_EMAIL",
                        promptContext: "Eres el Account Manager. Escribe un mensaje breve y genuino preguntando cómo se han sentido en su primera semana. Debe sonar humano, no corporativo.",
                        messageTemplate: "Cliente: {{triggerData.contactName}}"
                    }
                }
            ]
        },

        // ─────────────────────────────────────────────────────
        // 4. REACTIVACIÓN COLD LEADS — 90 días LOST → caso éxito
        // ─────────────────────────────────────────────────────
        {
            name: "❄️ Reactivación Lead Frío (90 días)",
            description: "90 días tras marcar LOST, la IA envía un caso de éxito para reabrir.",
            isActive: true,
            triggerType: "DEAL_STAGE_CHANGED",
            triggerConfig: { stage: "LOST" },
            steps: [
                {
                    id: "s1",
                    type: "WAIT",
                    delay: days(90),
                    config: {}
                },
                {
                    id: "s2",
                    type: "AI_AGENT",
                    config: {
                        agentId,
                        aiTask: "SEND_EMAIL",
                        promptContext: "Han pasado 90 días. Redacta un email de reactivación muy breve. Menciona que tuvimos un caso de éxito reciente similar al de su empresa. Usa un tono casual. Incluye una sola pregunta de apertura al final.",
                        messageTemplate: "Contacto: {{triggerData.contactName}} | Industria: {{triggerData.industry}}"
                    }
                }
            ]
        },

        // ─────────────────────────────────────────────────────
        // 5. ALERTA CHURN — Sentimiento negativo → CEO
        // ─────────────────────────────────────────────────────
        {
            name: "💣 Prevención de Churn (Sentimiento Negativo)",
            description: "Si la IA detecta frustración en cualquier mensaje, alerta inmediata al gerente.",
            isActive: true,
            triggerType: "WHATSAPP_TRIGGER",
            triggerConfig: { channel: "all", priority: "critical" },
            steps: [
                {
                    id: "s1",
                    type: "AI_AGENT",
                    config: {
                        agentId,
                        aiTask: "CLASSIFY_INTENT",
                        promptContext: "Analiza el tono del mensaje. Si contiene queja, frustración, amenaza de cancelar o palabras negativas graves, responde NEGATIVE. En cualquier otro caso responde NEUTRAL.",
                        messageTemplate: "{{triggerData.content}}"
                    }
                },
                {
                    id: "s2",
                    type: "CONDITION",
                    config: {
                        variable: "ai_response",
                        operator: "contains",
                        value: "NEGATIVE"
                    }
                },
                {
                    id: "s3",
                    type: "CREATE_TASK",
                    config: {
                        actionType: "CREATE_TASK",
                        taskTitle: "⚠️ CHURN RISK: Intervenir con {{triggerData.sender}} AHORA",
                        priority: "URGENT"
                    }
                }
            ]
        },

        // ─────────────────────────────────────────────────────
        // 6. UPSELL POST-PROYECTO — 30 días COMPLETED → oferta
        // ─────────────────────────────────────────────────────
        {
            name: "🚀 Upsell Post-Lanzamiento (30 días)",
            description: "30 días tras entregar el proyecto, la IA propone servicios complementarios.",
            isActive: true,
            triggerType: "DEAL_STAGE_CHANGED",
            triggerConfig: { stage: "COMPLETED" },
            steps: [
                {
                    id: "s1",
                    type: "WAIT",
                    delay: days(30),
                    config: {}
                },
                {
                    id: "s2",
                    type: "AI_AGENT",
                    config: {
                        agentId,
                        aiTask: "SEND_EMAIL",
                        promptContext: "Han pasado 30 días desde que entregamos el proyecto. Escribe un email breve proponiendo una reunión de 15 minutos para hablar sobre estrategias de crecimiento para el siguiente trimestre. Ofrece algo específico según su industria.",
                        messageTemplate: "Cliente: {{triggerData.contactName}} | Servicio entregado: {{triggerData.dealTitle}}"
                    }
                },
                {
                    id: "s3",
                    type: "UPDATE_DEAL",
                    config: {
                        actionType: "UPDATE_DEAL",
                        dealStage: "UPSELL_OPPORTUNITY"
                    }
                }
            ]
        }

    ];

    for (const flow of flows) {
        const { steps, ...rest } = flow as any;
        await prisma.workflow.create({
            data: {
                ...rest,
                steps,
                companyId: company.id
            }
        });
        console.log(`✅ ${flow.name}`);
    }

    console.log(`\n🎉 ${flows.length} workflows seeded successfully!`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
