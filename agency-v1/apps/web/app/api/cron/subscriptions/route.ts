import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Seguridad: Verificar que sea una solicitud autorizada de cron (Ej: Vercel Cron Secret)
export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
         return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        console.log("⚙️ Ejecutando Cron de Renovación Mensual (Retainers)");
        
        // 1. Encontrar todos los proyectos Kanban activos que puedan ser retainers o Suscripciones Activas
        // En una empresa madura, esto se cruza con "Proposals" que sean "SIGNED" y tengan recurrencia.
        const subscribedCompanies = await prisma.company.findMany({
            where: {
                subscriptionStatus: "active",
                subscriptionTier: { in: ["pro", "enterprise"] }, // Ejemplo de tiers pagos
            }
        });

        let generated = 0;

        for (const company of subscribedCompanies) {
            // Ejemplo de lógica: Generar una factura el 1ro de cada mes por 5,000 USD de SEO Retainer.
            // Para un ERP B2B Completo, deberíamos leer el monto de un model `SubscriptionPlan` en BD.
            const billAmount = company.subscriptionTier === "pro" ? 2500 : 5000;
            
            await prisma.invoice.create({
                data: {
                    clientName: company.name,
                    serviceDescription: `Retainer B2B (Mantenimiento Mensual) - Tier ${company.subscriptionTier.toUpperCase()}`,
                    totalAmount: billAmount,
                    advanceAmount: 0,
                    finalAmount: billAmount, // Cobrar el 100% de la cuota
                    companyId: company.id,
                    status: "DRAFT_AWAITING_PAYMENT"
                }
            });
            generated++;
        }

        return NextResponse.json({ success: true, generatedInvoices: generated });

    } catch (error) {
        console.error("[CRON_SUBSCRIPTIONS]", error);
        return new NextResponse("Cron Job Failed", { status: 500 });
    }
}
