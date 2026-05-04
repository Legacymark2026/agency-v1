/**
 * lib/billing/usage.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lógica para reportar el uso excedente a Stripe (Metered Billing).
 * Permite cobrar centavos de dólar/peso por cada interacción de IA extra.
 */

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Reporta el consumo no reportado de una compañía a Stripe.
 * Solo aplicable si la compañía tiene una suscripción activa
 * y usa productos de Stripe con Metered Billing.
 */
export async function reportUsageToStripe(companyId: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { stripeSubscriptionId: true, subscriptionStatus: true }
    });

    if (!company?.stripeSubscriptionId || company.subscriptionStatus !== "active") {
      return { success: false, message: "No active Stripe subscription" };
    }

    // Buscar items de la suscripción (para encontrar el item de "uso")
    const subscription = await stripe.subscriptions.retrieve(company.stripeSubscriptionId);
    
    // Necesitamos el `subscription_item` configurado como "metered"
    // Esto se asume que se configura en el dashboard de Stripe.
    const meteredItem = subscription.items.data.find(
      (item) => item.price.recurring?.usage_type === "metered"
    );

    if (!meteredItem) {
      return { success: false, message: "No metered item found in subscription" };
    }

    // Contar logs no reportados
    const unreportedUsage = await prisma.usageLog.aggregate({
      where: {
        companyId,
        stripeReported: false,
        metric: "AI_MESSAGE" // O el tipo de métrica que queramos cobrar
      },
      _sum: { value: true }
    });

    const quantity = unreportedUsage._sum.value || 0;

    if (quantity === 0) {
      return { success: true, message: "No new usage to report" };
    }

    // Enviar el reporte a Stripe
    await (stripe.subscriptionItems as any).createUsageRecord(
      meteredItem.id,
      {
        quantity: Math.ceil(quantity),
        timestamp: Math.floor(Date.now() / 1000),
        action: "increment",
      }
    );

    // Marcar como reportado en BD
    await prisma.usageLog.updateMany({
      where: {
        companyId,
        stripeReported: false,
        metric: "AI_MESSAGE"
      },
      data: { stripeReported: true }
    });

    logger.info(`[Billing] Reported ${quantity} usage units for company ${companyId}`);
    return { success: true, reportedQuantity: quantity };

  } catch (error) {
    logger.error(`[Billing] Error reporting usage for company ${companyId}:`, error);
    return { success: false, error };
  }
}

/**
 * Función para ejecutar por cronjob cada noche o cada hora,
 * que itere sobre todas las empresas activas y reporte.
 */
export async function syncAllUsageToStripe() {
  const companies = await prisma.company.findMany({
    where: { subscriptionStatus: "active", stripeSubscriptionId: { not: null } },
    select: { id: true }
  });

  for (const company of companies) {
    await reportUsageToStripe(company.id);
  }
}
