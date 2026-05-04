/**
 * lib/inbox/sla.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SLA & Response Time Tracking (P0 #2)
 *
 * Manages SLA breaches, response times, and real-time alerts
 * - Tracks first response time
 * - Monitors resolution time
 * - Generates breach alerts at 60%, 80%, 100%
 * - Pauses/resumes SLA for external delays
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export interface SLAConfig {
  firstResponseMinutes: number;
  resolutionMinutes: number;
}

/**
 * Obtiene configuración de SLA para un company (default o custom)
 */
export async function getSLAConfig(
  companyId: string
): Promise<SLAConfig> {
  try {
    // En producción: leer de CompanyConfig.inboxSLAConfig
    // Por ahora, defaults
    return {
      firstResponseMinutes: 60, // 1 hora
      resolutionMinutes: 1440, // 24 horas
    };
  } catch (error) {
    logger.error("[SLA] Error getting SLA config", {
      companyId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { firstResponseMinutes: 60, resolutionMinutes: 1440 };
  }
}

/**
 * Crea o actualiza SLA para una conversación
 */
export async function initializeSLA(
  conversationId: string,
  companyId: string
): Promise<any> {
  try {
    const config = await getSLAConfig(companyId);

    const existing = await prisma.conversationSLA.findUnique({
      where: { conversationId },
    });

    if (existing) return existing;

    const sla = await prisma.conversationSLA.create({
      data: {
        conversationId,
        firstResponseMinutes: config.firstResponseMinutes,
        resolutionMinutes: config.resolutionMinutes,
        status: "OPEN",
      },
    });

    logger.info("[SLA] SLA initialized", {
      conversationId,
      firstResponseMinutes: config.firstResponseMinutes,
      resolutionMinutes: config.resolutionMinutes,
    });

    return sla;
  } catch (error) {
    logger.error("[SLA] Error initializing SLA", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Marca primera respuesta como enviada
 */
export async function markFirstResponse(
  conversationId: string
): Promise<void> {
  try {
    const sla = await prisma.conversationSLA.findUnique({
      where: { conversationId },
    });

    if (!sla || sla.firstResponseAt) return; // Ya respondido

    const now = new Date();
    const minutesSinceCreation = Math.floor(
      (now.getTime() - sla.createdAt.getTime()) / (1000 * 60)
    );

    const isBreach = minutesSinceCreation > sla.firstResponseMinutes;

    await prisma.conversationSLA.update({
      where: { conversationId },
      data: {
        firstResponseAt: now,
        status: isBreach ? "BREACHED" : sla.status,
        breachedAt: isBreach ? now : null,
      },
    });

    if (isBreach) {
      logger.warn("[SLA] First response SLA breached", {
        conversationId,
        minutesAllowed: sla.firstResponseMinutes,
        minutesTaken: minutesSinceCreation,
      });
    }
  } catch (error) {
    logger.error("[SLA] Error marking first response", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Marca conversación como resuelta
 */
export async function markAsResolved(
  conversationId: string
): Promise<void> {
  try {
    const sla = await prisma.conversationSLA.findUnique({
      where: { conversationId },
    });

    if (!sla || sla.resolvedAt) return; // Ya resuelta

    const now = new Date();
    const minutesSinceCreation = Math.floor(
      (now.getTime() - sla.createdAt.getTime()) / (1000 * 60)
    ) - sla.pausedMinutes; // Restar tiempo pausado

    const isBreach = minutesSinceCreation > sla.resolutionMinutes;

    await prisma.conversationSLA.update({
      where: { conversationId },
      data: {
        resolvedAt: now,
        status: isBreach ? "BREACHED" : "MET",
        breachedAt: isBreach && !sla.breachedAt ? now : sla.breachedAt,
      },
    });

    if (isBreach) {
      logger.warn("[SLA] Resolution SLA breached", {
        conversationId,
        minutesAllowed: sla.resolutionMinutes,
        minutesTaken: minutesSinceCreation,
      });
    }
  } catch (error) {
    logger.error("[SLA] Error marking as resolved", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Pausa SLA (ej: esperando respuesta de cliente)
 */
export async function pauseSLA(conversationId: string): Promise<void> {
  try {
    const sla = await prisma.conversationSLA.findUnique({
      where: { conversationId },
    });

    if (!sla || sla.pausedAt || sla.status === "PAUSED") return;

    await prisma.conversationSLA.update({
      where: { conversationId },
      data: {
        pausedAt: new Date(),
        status: "PAUSED",
      },
    });

    logger.info("[SLA] SLA paused", { conversationId });
  } catch (error) {
    logger.error("[SLA] Error pausing SLA", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Reanuda SLA después de pausa
 */
export async function resumeSLA(conversationId: string): Promise<void> {
  try {
    const sla = await prisma.conversationSLA.findUnique({
      where: { conversationId },
    });

    if (!sla || !sla.pausedAt) return;

    const pausedDuration = Math.floor(
      (new Date().getTime() - sla.pausedAt.getTime()) / (1000 * 60)
    );

    await prisma.conversationSLA.update({
      where: { conversationId },
      data: {
        pausedAt: null,
        pausedMinutes: sla.pausedMinutes + pausedDuration,
        status: "OPEN",
      },
    });

    logger.info("[SLA] SLA resumed", {
      conversationId,
      pausedMinutes: pausedDuration,
    });
  } catch (error) {
    logger.error("[SLA] Error resuming SLA", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Obtiene warnings para mostrar en UI
 * Retorna % remaining y status de breach
 */
export async function getSLAWarning(
  conversationId: string
): Promise<{ status: "OK" | "WARNING" | "CRITICAL" | "BREACHED"; percentage: number } | null> {
  try {
    const sla = await prisma.conversationSLA.findUnique({
      where: { conversationId },
    });

    if (!sla || sla.resolvedAt || sla.breachedAt) {
      return { status: "BREACHED", percentage: 100 };
    }

    const minuteLimit = sla.firstResponseAt
      ? sla.resolutionMinutes
      : sla.firstResponseMinutes;
    const minutesSinceCreation = Math.floor(
      (new Date().getTime() - sla.createdAt.getTime()) / (1000 * 60)
    ) - sla.pausedMinutes;

    const percentage = Math.round((minutesSinceCreation / minuteLimit) * 100);

    let status: "OK" | "WARNING" | "CRITICAL" | "BREACHED" = "OK";
    if (percentage >= 100) status = "BREACHED";
    else if (percentage >= 80) status = "CRITICAL";
    else if (percentage >= 60) status = "WARNING";

    return { status, percentage: Math.min(percentage, 100) };
  } catch (error) {
    logger.error("[SLA] Error getting SLA warning", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Obtiene todas las SLAs breached para dashboard
 */
export async function getBreachedSLAs(companyId: string) {
  return prisma.conversationSLA.findMany({
    where: {
      conversation: { companyId },
      breachedAt: { not: null },
    },
    include: {
      conversation: {
        include: { lead: true, assignee: true },
      },
    },
    orderBy: { breachedAt: "desc" },
    take: 50,
  });
}
