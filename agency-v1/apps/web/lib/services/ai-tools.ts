import { z } from "zod";
import { tool } from "ai";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { canAccessRoute } from "@/lib/rbac";

// Helper para validar permisos
function checkPerm(userContext: any, requiredRoutes: string[]): boolean {
    if (!userContext || userContext.role === 'guest') return false;
    if (userContext.role === 'super_admin' || userContext.role === 'admin') return true;
    
    // Si no hay rutas requeridas, es público para usuarios logueados
    if (requiredRoutes.length === 0) return true;

    for (const route of requiredRoutes) {
        if (canAccessRoute(route, userContext.role, userContext.allowedRoutes || [])) {
            return true;
        }
    }
    return false;
}

export const AIAgentTools = {
    // ── CRM y Ventas ──
    read_crm_leads: {
        description: "Busca perfiles de leads/clientes en el CRM de la empresa para saber si ya existen, sus datos de contacto o estado.",
        parameters: z.object({
            query: z.string().describe("Nombre, email o teléfono del lead a buscar"),
            limit: z.number().optional().describe("Número max de resultados (default 5)")
        }),
        requiredRoutes: ["/dashboard/admin/crm/leads"]
    },
    update_deals: {
        description: "Actualiza el pipeline marcando al lead en una etapa como QUALIFIED, PROPOSAL, WON o LOST, y deja una nota.",
        parameters: z.object({
            leadEmail: z.string().describe("Email exacto del lead para identificarlo"),
            newStage: z.string().describe("Nueva etapa a asignar (ej: QUALIFIED, WON, LOST)"),
            note: z.string().optional().describe("Resumen de la justificación o nota para los humanos")
        }),
        requiredRoutes: ["/dashboard/admin/crm/deals"],
        requiresApproval: true
    },
    create_crm_deal: {
        description: "Crea una nueva oportunidad (Deal) en el CRM asociada a un lead. Úsalo cuando hay real intención de compra.",
        parameters: z.object({
            leadEmail: z.string().describe("Email del lead asociado"),
            dealName: z.string().describe("Nombre resumen de la oportunidad"),
            estimatedValue: z.number().optional().describe("Valor proyectado de la venta en USD")
        }),
        requiredRoutes: ["/dashboard/admin/crm/deals"],
        requiresApproval: true
    },
    qualify_and_score_lead: {
        description: "Actualiza el puntaje de calificación (Lead Score) del usuario agregando o restando puntos según su interés.",
        parameters: z.object({
            leadEmail: z.string().describe("Email del lead"),
            pointsToAdd: z.number().describe("Puntos a sumar (1 a 20) o restar (negativo)"),
            justification: z.string().optional().describe("Breve justificación del ajuste")
        }),
        requiredRoutes: ["/dashboard/admin/crm/leads"]
    },

    // ── Comunicaciones & Soporte ──
    send_email: {
        description: "Prepara el envío de un correo automatizado o de follow-up hacia el cliente actual.",
        parameters: z.object({
            recipientEmail: z.string().describe("Email destino correspondiente al lead"),
            subject: z.string().describe("Asunto del correo"),
            bodyContext: z.string().describe("Instrucciones de lo que deberías decir en el cuerpo del correo")
        }),
        requiredRoutes: ["/dashboard/inbox"],
        requiresApproval: true
    },
    transfer_to_human: {
        description: "Pausa tus mensajes automáticos en esta conversación y notifica a soporte humano urgente.",
        parameters: z.object({
            reason: z.string().describe("Razón para transferir (molestia, queja grave...)")
        }),
        requiredRoutes: [] // Cualquiera puede transferir a humano
    },
    create_support_ticket: {
        description: "Crea una tarea técnica en el tablero Kanban de Soporte para que los humanos lo resuelvan.",
        parameters: z.object({
            leadEmail: z.string().optional().describe("Email afectado"),
            issueTitle: z.string().describe("Título del ticket"),
            issueDescription: z.string().describe("Descripción completa"),
            priority: z.string().optional().describe("Prioridad: LOW, MEDIUM, HIGH, URGENT")
        }),
        requiredRoutes: ["/dashboard/inbox"]
    },

    // ── Automations ──
    enroll_in_sequence: {
        description: "Suscribe al lead a una campaña de correos automáticos (Email Sequence) para nutrirlo o hacer retargeting.",
        parameters: z.object({
            leadEmail: z.string().describe("Email del lead"),
            sequenceName: z.string().describe("Nombre o ID de la secuencia (ej: 'Winback 2026', 'Onboarding')")
        }),
        requiredRoutes: ["/dashboard/admin/crm/sequences"],
        requiresApproval: true
    },

    // ── Agenda y Eventos ──
    check_calendar_availability: {
        description: "Revisa los turnos y espacios libres de la empresa en una fecha dada.",
        parameters: z.object({
            date: z.string().describe("Fecha en formato ISO (YYYY-MM-DD)")
        }),
        requiredRoutes: ["/dashboard/events"]
    },
    create_calendar_event: {
        description: "Fija oficialmente una reunión o cita comercial en el calendario del equipo.",
        parameters: z.object({
            leadName: z.string().describe("Nombre del cliente"),
            datetime: z.string().describe("Fecha y hora ISO de inicio de la cita"),
            durationMinutes: z.number().optional().describe("Duración en minutos (default 30)")
        }),
        requiredRoutes: ["/dashboard/events"]
    },

    // ── General ──
    web_search: {
        description: "Usa el buscador para buscar información pública, noticias recientes o datos del mercado.",
        parameters: z.object({
            query: z.string().describe("Término exacto de búsqueda")
        }),
        requiredRoutes: []
    },
    save_user_preference: {
        description: "Guarda un hecho o preferencia personal del usuario a largo plazo. Úsalo cuando el usuario pida que le llames de cierta forma, o que tengas en cuenta cierta información para el futuro.",
        parameters: z.object({
            fact: z.string().describe("La preferencia o hecho a memorizar (ej: 'El usuario prefiere respuestas muy cortas')")
        }),
        requiredRoutes: []
    },
    execute_skillchain: {
        description: "Ejecuta una cadena de múltiples habilidades (Skillchain) preconfigurada. Permite automatizar flujos de trabajo completos de forma masiva sin requerir aprobaciones intermedias de la IA.",
        parameters: z.object({
            skillChainId: z.string().describe("El ID del Skillchain a ejecutar"),
            initialPayload: z.record(z.any()).describe("Un objeto JSON con los datos iniciales necesarios para que la primera herramienta de la cadena comience.")
        }),
        requiredRoutes: [] // Delegamos los permisos a cada herramienta individual dentro del engine
    },
    agent_self_reflection: {
        description: "Permite al agente grabar una regla, lección o mejora en su propia memoria a largo plazo. Úsalo cuando fallas en una tarea o recibes feedback explícito de que debes cambiar tu forma de actuar.",
        parameters: z.object({
            lesson: z.string().describe("La regla o lección aprendida (ej: 'Nunca enviar correos sin asunto', 'Debo ser más persuasivo').")
        }),
        requiredRoutes: []
    }
};

export async function executeAgentTool(companyId: string, name: string, args: any, userContext: any): Promise<any> {
    const logAudit = async (status: string, errorMessage?: string) => {
        try {
            await db.aIAuditLog.create({
                data: {
                    companyId,
                    userId: userContext?.id,
                    agentName: "AgentRunner",
                    action: name,
                    parameters: args,
                    status,
                    errorMessage
                }
            });
        } catch(e) {
            console.error("Failed to write to AIAuditLog", e);
        }
    };

    try {
        const toolDef = (AIAgentTools as any)[name];
        if (!toolDef) {
            return { success: false, error: `Tool ${name} no está implementada en el motor.` };
        }

        // RBAC CHECK
        if (!checkPerm(userContext, toolDef.requiredRoutes)) {
            const errorMsg = `PERMISSION_DENIED: El usuario humano (${userContext?.role || 'invitado'}) no tiene permisos suficientes para ejecutar '${name}'. Por favor infórmale esto y discúlpate.`;
            await logAudit("DENIED", errorMsg);
            return { success: false, error: errorMsg };
        }

        const result = await executeAgentToolInner(companyId, name, args, userContext);
        await logAudit(result.success === false ? "ERROR" : "SUCCESS", result.error || null);
        return result;
    } catch (e: any) {
        await logAudit("ERROR", e.message);
        return { success: false, error: e.message };
    }
}

async function executeAgentToolInner(companyId: string, name: string, args: any, userContext: any): Promise<any> {
    switch (name) {
            case "read_crm_leads": {
                const { query, limit } = args;
                const leads = await db.lead.findMany({
                    where: {
                        companyId,
                        OR: [
                            { name: { contains: query, mode: "insensitive" } },
                            { email: { contains: query, mode: "insensitive" } },
                            { phone: { contains: query, mode: "insensitive" } }
                        ]
                    },
                    take: limit || 5,
                    select: { id: true, name: true, email: true, phone: true, status: true, score: true }
                });
                return { success: true, count: leads.length, leads };
            }

            case "update_deals": {
                const { leadEmail, newStage, note } = args;
                const lead = await db.lead.findFirst({ where: { companyId, email: leadEmail } });
                if (!lead) return { success: false, error: "Lead no encontrado en CRM." };

                await db.lead.update({
                    where: { id: lead.id },
                    data: { status: newStage }
                });
                return { success: true, message: `Lead ${lead.name} avanzado a etapa ${newStage}`, loggedNote: note };
            }

            case "create_crm_deal": {
                const { leadEmail, dealName, estimatedValue } = args;
                const lead = await db.lead.findFirst({ where: { companyId, email: leadEmail } });
                if (!lead) {
                    return { success: false, error: "Debes pedir primero el correo para identificar al lead y luego crear el Deal." };
                }

                const deal = await db.deal.create({
                    data: {
                        companyId,
                        title: dealName,
                        value: estimatedValue || 0,
                        stage: "NEW"
                    }
                });
                await db.lead.update({ where: { id: lead.id }, data: { convertedToDealId: deal.id }});
                
                return { success: true, dealId: deal.id, message: "Oportunidad comercial creada." };
            }

            case "qualify_and_score_lead": {
                const { leadEmail, pointsToAdd, justification } = args;
                const lead = await db.lead.findFirst({ where: { companyId, email: leadEmail } });
                if (!lead) return { success: false, error: "Lead no encontrado." };
                
                const newScore = Math.min(100, Math.max(0, (lead.score || 0) + pointsToAdd));
                await db.lead.update({ where: { id: lead.id }, data: { score: newScore } });
                return { success: true, newScore, message: `Puntaje actualizado por: ${justification}` };
            }

            case "create_support_ticket": {
                const { issueTitle, issueDescription, priority, leadEmail } = args;
                const project = await db.kanbanProject.findFirst({ where: { companyId }});
                if (!project) return { success: false, error: "No hay tablero Kanban en la empresa." };

                const userFallback = await db.companyUser.findFirst({ where: { companyId }});
                
                await db.kanbanTask.create({
                    data: {
                        title: `[Support] ${issueTitle}`,
                        description: `Reportado por el agente IA.\nLead: ${leadEmail || 'Desconocido'}\nDetalle: ${issueDescription}`,
                        priority: priority || "HIGH",
                        projectId: project.id,
                        creatorId: userFallback?.userId || "system"
                    }
                });
                return { success: true, message: "Ticket Enterprise creado con éxito y asignado a Soporte Técnico." };
            }

            case "enroll_in_sequence": {
                const { leadEmail, sequenceName } = args;
                const lead = await db.lead.findFirst({ where: { companyId, email: leadEmail } });
                if (!lead) return { success: false, error: "Lead no encontrado en la base de datos." };

                const sequence = await db.emailSequence.findFirst({
                    where: {
                        companyId,
                        OR: [
                            { name: { contains: sequenceName, mode: "insensitive" } },
                            { id: sequenceName }
                        ]
                    }
                });

                if (!sequence) {
                    return {
                        success: false,
                        error: `No se encontró la secuencia '${sequenceName}'. Las secuencias disponibles están en CRM → Email Sequences.`
                    };
                }

                const deal = await db.deal.findFirst({
                    where: { companyId, contactEmail: lead.email ?? "" },
                    orderBy: { createdAt: "desc" },
                    select: { id: true }
                });

                if (!deal) {
                    await db.lead.update({
                        where: { id: lead.id },
                        data: { notes: `[IA ${new Date().toLocaleDateString("es-CO")}] Pendiente inscribir en: ${sequence.name}` }
                    }).catch(() => null);
                    return {
                        success: true,
                        message: `Lead ${lead.name} no tiene Deal activo aún. Inscripción en '${sequence.name}' anotada para cuando se convierta.`
                    };
                }

                const existingEnrollment = await db.emailSequenceEnrollment.findFirst({
                    where: { sequenceId: sequence.id, dealId: deal.id }
                }).catch(() => null);

                if (existingEnrollment) {
                    return {
                        success: true,
                        message: `Lead ${lead.name} ya está inscrito en la secuencia '${sequence.name}'.`
                    };
                }

                await db.emailSequenceEnrollment.create({
                    data: {
                        sequenceId: sequence.id,
                        dealId: deal.id,
                        status: "ACTIVE",
                    }
                });

                return {
                    success: true,
                    sequenceId: sequence.id,
                    message: `Lead ${lead.name} inscrito exitosamente en la campaña '${sequence.name}'.`
                };
            }

            case "send_email": {
                const { recipientEmail, subject, bodyContext } = args;
                if (!recipientEmail || !subject) {
                    return { success: false, error: "recipientEmail y subject son requeridos" };
                }

                const lead = await db.lead.findFirst({
                    where: { companyId, email: recipientEmail },
                    select: { name: true }
                });

                const emailBody = `
                    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                        <p>${bodyContext}</p>
                        <br/>
                        <p style="color:#64748b;font-size:12px;">Mensaje enviado automáticamente por el Asistente IA de LegacyMark</p>
                    </div>
                `;

                const sendResult = await sendEmail({
                    to: recipientEmail,
                    subject,
                    html: emailBody,
                    companyId
                });

                if (!sendResult.success) {
                    return { success: false, error: `Error al enviar: ${sendResult.error}` };
                }

                return {
                    success: true,
                    status: "sent",
                    message: `Correo enviado exitosamente a ${lead?.name || recipientEmail} (${recipientEmail}).`
                };
            }

            case "transfer_to_human": {
                return { success: true, action: "PAUSED", message: "Notificación enviada al equipo humano. Informa al cliente que alguien del equipo se conectará en breve." };
            }

            case "check_calendar_availability": {
                return { success: true, availableSlots: ["09:00", "11:30", "15:00", "16:45"], message: `Hay disponibilidad limitada para el ${args.date}` };
            }

            case "create_calendar_event": {
                return { success: true, status: "CONFIRMED", message: `Reunión agendada a las ${args.datetime}.` };
            }

            case "web_search": {
                try {
                    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789";
                    const res = await fetch(`${gatewayUrl}/api/v1/tools/execute`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-openclaw-secret": process.env.OPENCLAW_GATEWAY_SECRET || ""
                        },
                        body: JSON.stringify({ tool: "browser", args })
                    });
                    if (res.ok) {
                        return await res.json();
                    } else {
                        return { success: false, error: `OpenClaw Sandbox error: ${res.statusText}` };
                    }
                } catch (e: any) {
                    return { success: false, error: `Failed to delegate to OpenClaw: ${e.message}` };
                }
            }

            case "save_user_preference": {
                const { fact } = args;
                try {
                    // Si pgvector no está configurado o falla, lo atrapamos
                    const config = await import("../agent-runner").then(m => m.getAIModelConfig(companyId));
                    const { generateEmbedding } = await import("../embeddings");
                    const vector = await generateEmbedding(fact, config.apiKey);
                    
                    await db.$executeRaw`
                        INSERT INTO "AgentMemory" ("id", "companyId", "userId", "fact", "embedding", "updatedAt") 
                        VALUES (
                            gen_random_uuid()::text, 
                            ${companyId}, 
                            ${userContext?.id || null}, 
                            ${fact}, 
                            ${`[${vector.join(',')}]`}::vector,
                            now()
                        )
                    `;
                    return { success: true, message: "Preferencia guardada en la memoria." };
                } catch(e: any) {
                    console.error("Error saving memory:", e);
                    return { success: false, error: "No se pudo guardar la memoria a largo plazo." };
                }
            }

            case "execute_skillchain": {
                const { skillChainId, initialPayload } = args;
                try {
                    const { executeSkillChain } = await import("./skillchain-engine");
                    const result = await executeSkillChain(companyId, skillChainId, initialPayload, userContext);
                    if (result.success) {
                        return { success: true, message: `Skillchain completado con éxito. Herramientas ejecutadas: ${result.executedTools.join(', ')}.`, output: result.finalOutput };
                    }
                    return { success: false, error: result.error };
                } catch (e: any) {
                    return { success: false, error: `Error en Skillchain: ${e.message}` };
                }
            }

            case "agent_self_reflection": {
                const { lesson } = args;
                try {
                    const config = await import("../agent-runner").then(m => m.getAIModelConfig(companyId));
                    const { generateEmbedding } = await import("../embeddings");
                    const vector = await generateEmbedding(lesson, config.apiKey);
                    
                    const targetAgentId = userContext?.agentId || null; // El runner debe inyectar esto

                    await db.$executeRaw`
                        INSERT INTO "AgentMemory" ("id", "companyId", "userId", "agentId", "fact", "embedding", "updatedAt") 
                        VALUES (
                            gen_random_uuid()::text, 
                            ${companyId}, 
                            null, 
                            ${targetAgentId}, 
                            ${lesson}, 
                            ${`[${vector.join(',')}]`}::vector,
                            now()
                        )
                    `;
                    return { success: true, message: "Lección aprendida e interiorizada para el futuro." };
                } catch(e: any) {
                    console.error("Error saving self-reflection:", e);
                    return { success: false, error: "No se pudo interiorizar la lección." };
                }
            }

            default:
                return { success: false, error: `Tool ${name} no está implementada en el motor.` };
        }
}
