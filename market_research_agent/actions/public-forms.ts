"use server";

import { prisma } from "@/lib/prisma";
import { triggerWorkflow } from "./automation";

// Rate Limit simulado para prevenir SPAM básico en la ruta de Edge/Server Actions
// En producción se recomienda usar algo como @upstash/ratelimit
const rateLimiter = new Map<string, { count: number; lastTime: number }>();

export async function submitLeadMagnetForm(data: {
    name: string;
    email: string;
    phone: string;
    service: string;
    message?: string;
    source?: string;
}) {
    // 1. Basic Rate Limiting (por IP en un entorno ideal, aquí proxy de email)
    const now = Date.now();
    const limitWindow = 60000; // 1 min
    const maxRequests = 3;
    
    if (data.email) {
        const limiter = rateLimiter.get(data.email) || { count: 0, lastTime: now };
        if (now - limiter.lastTime < limitWindow) {
            limiter.count++;
            if (limiter.count > maxRequests) {
                return { error: "Demasiadas solicitudes. Por favor, intenta más tarde." };
            }
        } else {
            limiter.count = 1;
            limiter.lastTime = now;
        }
        rateLimiter.set(data.email, limiter);
    }

    try {
        // En un escenario real, si el sistema es Multi-Tenant para varias empresas,
        // The landing page would be bound to a specific companyId or account.
        // Simularemos tomando la primer compañía existente para este caso de marketing propio:
        const company = await prisma.company.findFirst();
        if (!company) {
            return { error: "No se encontro la configuración base de la empresa." };
        }

        const exactSource = data.source || "Flyering_LeadMagnet";

        // 2. Revisar si el email ya existe para no duplicar (Opcional, pero recomendado)
        let leadId = null;
        const exist = await prisma.lead.findFirst({
            where: { email: data.email, companyId: company.id }
        });

        if (!exist) {
            // Crear el prospecto
            const newLead = await prisma.lead.create({
                data: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    status: "NEW", // Estado inicial del pipeline
                    source: exactSource,
                    message: data.message ? `${data.service}: ${data.message}` : data.service,
                    companyId: company.id,
                }
            });
            leadId = newLead.id;
        } else {
             leadId = exist.id;
        }

        // 3. ¡LA MAGIA! Disparar el motor de automatizaciones (Workflows) 
        // Pasamos el "source" explícito para que los flujos puedan escuchar "sólo" este formulario.
        await triggerWorkflow('FORM_SUBMISSION', {
            id: leadId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            source: exactSource,
            companyId: company.id
            // se puede enviar 'message', 'service' etc., como "triggerData" para parsear en variables {{service}}
        });

        return { success: true };
    } catch (e: any) {
        console.error("Error submitting Lead Magnet form:", e);
        return { error: "Ocurrió un error al procesar tu solicitud." };
    }
}
