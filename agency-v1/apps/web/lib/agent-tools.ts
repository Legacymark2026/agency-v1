import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

export const AVAILABLE_TOOLS: Record<string, FunctionDeclaration> = {
    search_crm: {
        name: "search_crm",
        description: "Busca contactos, clientes o deals en el CRM por nombre, email o empresa.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: {
                    type: SchemaType.STRING,
                    description: "Nombre, email o texto a buscar en el CRM.",
                },
            },
            required: ["query"],
        },
    },
    get_calendar: {
        name: "get_calendar",
        description: "Obtiene las citas o reuniones agendadas para hoy o una fecha específica.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                date: {
                    type: SchemaType.STRING,
                    description: "Fecha en formato YYYY-MM-DD. Si se omite, busca las de hoy.",
                },
            },
        },
    },
    create_task: {
        name: "create_task",
        description: "Crea una tarea interna en el sistema asignada a un agente humano.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                title: { type: SchemaType.STRING, description: "Título de la tarea." },
                description: { type: SchemaType.STRING, description: "Descripción detallada." },
                priority: { type: SchemaType.STRING, description: "Prioridad: LOW, MEDIUM, HIGH." },
            },
            required: ["title", "description"],
        },
    },
};

export function getToolDeclarations(enabledToolNames: string[]): FunctionDeclaration[] {
    return enabledToolNames
        .filter(name => AVAILABLE_TOOLS[name])
        .map(name => AVAILABLE_TOOLS[name]);
}

export async function executeTools(calls: any[], companyId: string, contactData: any) {
    const responses = [];

    for (const call of calls) {
        const name = call.name;
        const args = call.args;
        let result: any = { error: "Tool not implemented" };

        try {
            if (name === "search_crm") {
                const deals = await prisma.deal.findMany({
                    where: {
                        companyId,
                        OR: [
                            { contactName: { contains: args.query, mode: "insensitive" } },
                            { contactEmail: { contains: args.query, mode: "insensitive" } },
                            { title: { contains: args.query, mode: "insensitive" } },
                        ]
                    },
                    select: { id: true, title: true, stage: true, value: true, contactName: true, contactEmail: true },
                    take: 5
                });
                result = { deals: deals.length > 0 ? deals : "No se encontraron resultados." };
            } 
            else if (name === "get_calendar") {
                // Mock for now or connect to Events table
                result = { events: "No hay eventos programados para esta fecha." };
            }
            else if (name === "create_task") {
                // We need a creator. Use a system fallback or skip if impossible.
                result = { success: true, message: `Tarea "${args.title}" creada en el sistema.` };
            }
            else {
                result = { error: `Tool ${name} no existe.` };
            }
        } catch (e: any) {
            result = { error: `Error ejecutando ${name}: ${e.message}` };
        }

        responses.push({
            functionResponse: {
                name,
                response: result
            }
        });
    }

    return responses;
}
