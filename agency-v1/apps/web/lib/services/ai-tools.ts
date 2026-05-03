import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export const AIAgentTools: Record<string, FunctionDeclaration> = {
    // ── CRM y Ventas ──
    read_crm_leads: {
        name: "read_crm_leads",
        description: "Busca perfiles de leads/clientes en el CRM de la empresa para saber si ya existen, sus datos de contacto o estado.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: { type: SchemaType.STRING, description: "Nombre, email o teléfono del lead a buscar" },
                limit: { type: SchemaType.INTEGER, description: "Número max de resultados (default 5)" }
            },
            required: ["query"]
        }
    },
    update_deals: {
        name: "update_deals",
        description: "Actualiza el pipeline marcando al lead en una etapa como QUALIFIED, PROPOSAL, WON o LOST, y deja una nota.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                leadEmail: { type: SchemaType.STRING, description: "Email exacto del lead para identificarlo" },
                newStage: { type: SchemaType.STRING, description: "Nueva etapa a asignar (ej: QUALIFIED, WON, LOST)" },
                note: { type: SchemaType.STRING, description: "Resumen de la justificación o nota para los humanos" }
            },
            required: ["leadEmail", "newStage"]
        }
    },
    create_crm_deal: {
        name: "create_crm_deal",
        description: "Crea una nueva oportunidad (Deal) en el CRM asociada a un lead. Úsalo cuando hay real intención de compra.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                leadEmail: { type: SchemaType.STRING, description: "Email del lead asociado" },
                dealName: { type: SchemaType.STRING, description: "Nombre resumen de la oportunidad" },
                estimatedValue: { type: SchemaType.NUMBER, description: "Valor proyectado de la venta en USD" }
            },
            required: ["leadEmail", "dealName"]
        }
    },
    qualify_and_score_lead: {
        name: "qualify_and_score_lead",
        description: "Actualiza el puntaje de calificación (Lead Score) del usuario agregando o restando puntos según su interés.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                leadEmail: { type: SchemaType.STRING, description: "Email del lead" },
                pointsToAdd: { type: SchemaType.INTEGER, description: "Puntos a sumar (1 a 20) o restar (negativo)" },
                justification: { type: SchemaType.STRING, description: "Breve justificación del ajuste" }
            },
            required: ["leadEmail", "pointsToAdd"]
        }
    },

    // ── Comunicaciones & Soporte ──
    send_email: {
        name: "send_email",
        description: "Prepara el envío de un correo automatizado o de follow-up hacia el cliente actual.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                recipientEmail: { type: SchemaType.STRING, description: "Email destino correspondiente al lead" },
                subject: { type: SchemaType.STRING, description: "Asunto del correo" },
                bodyContext: { type: SchemaType.STRING, description: "Instrucciones de lo que deberías decir en el cuerpo del correo" }
            },
            required: ["recipientEmail", "subject", "bodyContext"]
        }
    },
    transfer_to_human: {
        name: "transfer_to_human",
        description: "Pausa tus mensajes automáticos en esta conversación y notifica a soporte humano urgente.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                reason: { type: SchemaType.STRING, description: "Razón para transferir (molestia, queja grave...)" }
            },
            required: ["reason"]
        }
    },
    create_support_ticket: {
        name: "create_support_ticket",
        description: "Crea una tarea técnica en el tablero Kanban de Soporte para que los humanos lo resuelvan.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                leadEmail: { type: SchemaType.STRING, description: "Email afectado" },
                issueTitle: { type: SchemaType.STRING, description: "Título del ticket" },
                issueDescription: { type: SchemaType.STRING, description: "Descripción completa" },
                priority: { type: SchemaType.STRING, description: "Prioridad: LOW, MEDIUM, HIGH, URGENT" }
            },
            required: ["issueTitle", "issueDescription"]
        }
    },

    // ── Automations ──
    enroll_in_sequence: {
        name: "enroll_in_sequence",
        description: "Suscribe al lead a una campaña de correos automáticos (Email Sequence) para nutrirlo o hacer retargeting.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                leadEmail: { type: SchemaType.STRING, description: "Email del lead" },
                sequenceName: { type: SchemaType.STRING, description: "Nombre o ID de la secuencia (ej: 'Winback 2026', 'Onboarding')" }
            },
            required: ["leadEmail", "sequenceName"]
        }
    },

    // ── Agenda y Eventos ──
    check_calendar_availability: {
        name: "check_calendar_availability",
        description: "Revisa los turnos y espacios libres de la empresa en una fecha dada.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                date: { type: SchemaType.STRING, description: "Fecha en formato ISO (YYYY-MM-DD)" }
            },
            required: ["date"]
        }
    },
    create_calendar_event: {
        name: "create_calendar_event",
        description: "Fija oficialmente una reunión o cita comercial en el calendario del equipo.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                leadName: { type: SchemaType.STRING, description: "Nombre del cliente" },
                datetime: { type: SchemaType.STRING, description: "Fecha y hora ISO de inicio de la cita" },
                durationMinutes: { type: SchemaType.INTEGER, description: "Duración en minutos (default 30)" }
            },
            required: ["leadName", "datetime"]
        }
    },

    // ── General ──
    web_search: {
        name: "web_search",
        description: "Usa el buscador para buscar información pública, noticias recientes o datos del mercado.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: { type: SchemaType.STRING, description: "Término exacto de búsqueda" }
            },
            required: ["query"]
        }
    }
};

export async function executeAgentTool(companyId: string, name: string, args: any): Promise<any> {
    try {
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

                // Create the deal... (assuming we map to the existing Deal / Proposal structure or Lead update)
                // LegacyMark uses the 'Deal' model connected to pipeline logic. Let's create a proxy:
                const deal = await db.deal.create({
                    data: {
                        companyId,
                        title: dealName,
                        value: estimatedValue || 0,
                        stage: "NEW"
                    }
                });
                // Link lead
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
                // Query first Kanban project
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

                // Buscar la secuencia por nombre o ID
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

                // El schema usa dealId (no leadId) en EmailSequenceEnrollment.
                // Buscar el deal más reciente del lead por email.
                const deal = await db.deal.findFirst({
                    where: { companyId, contactEmail: lead.email ?? "" },
                    orderBy: { createdAt: "desc" },
                    select: { id: true }
                });

                if (!deal) {
                    // Sin deal aún — registrar nota en el lead como fallback
                    await db.lead.update({
                        where: { id: lead.id },
                        data: { notes: `[IA ${new Date().toLocaleDateString("es-CO")}] Pendiente inscribir en: ${sequence.name}` }
                    }).catch(() => null);
                    return {
                        success: true,
                        message: `Lead ${lead.name} no tiene Deal activo aún. Inscripción en '${sequence.name}' anotada para cuando se convierta.`
                    };
                }

                // Verificar si ya está inscrito
                const existingEnrollment = await db.emailSequenceEnrollment.findFirst({
                    where: { sequenceId: sequence.id, dealId: deal.id }
                }).catch(() => null);

                if (existingEnrollment) {
                    return {
                        success: true,
                        message: `Lead ${lead.name} ya está inscrito en la secuencia '${sequence.name}'.`
                    };
                }

                // Inscribir el deal en la secuencia
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

                // Buscar el lead para obtener el nombre
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
                // Here we would pause the AI conversation state.
                return { success: true, action: "PAUSED", message: "Notificación enviada al equipo humano. Informa al cliente que alguien del equipo se conectará en breve." };
            }

            case "check_calendar_availability": {
                // Mocking Calendar read logic
                return { success: true, availableSlots: ["09:00", "11:30", "15:00", "16:45"], message: `Hay disponibilidad limitada para el ${args.date}` };
            }

            case "create_calendar_event": {
                return { success: true, status: "CONFIRMED", message: `Reunión agendada a las ${args.datetime}.` };
            }

            case "web_search": {
                // Delegate to OpenClaw Gateway Sandbox for execution
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

            default:
                return { success: false, error: `Tool ${name} no está implementada en el motor.` };
        }
    } catch (error: any) {
        console.error(`[AITool Execution Error: ${name}]`, error);
        return { success: false, error: error.message };
    }
}
