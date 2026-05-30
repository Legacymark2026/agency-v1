import { prisma } from "@agency/database";

/**
 * Libera referidos PENDING a APPROVED si ya superaron el periodo de garantía.
 * Por defecto son 15 días, pero se puede configurar.
 */
export async function releaseReferrals(warrantyDays: number = 15) {
  const cutoffDate = new Date(Date.now() - warrantyDays * 24 * 60 * 60 * 1000);
  console.log(`[CronJob] Running referral release task. Warranty period: ${warrantyDays} days. Cutoff date: ${cutoffDate.toISOString()}`);

  try {
    // 1. Buscar referidos pendientes que hayan superado el período de garantía
    const pendingReferrals = await (prisma as any).referral.findMany({
      where: {
        status: "PENDING",
        createdAt: { lte: cutoffDate }
      }
    });

    if (pendingReferrals.length === 0) {
      console.log("[CronJob] No pending referrals found to release.");
      return { releasedCount: 0 };
    }

    console.log(`[CronJob] Found ${pendingReferrals.length} pending referrals past warranty. Transitioning to APPROVED...`);

    // 2. Transición a APPROVED en masa
    const referralIds = pendingReferrals.map((r: any) => r.id);
    const updateResult = await (prisma as any).referral.updateMany({
      where: {
        id: { in: referralIds }
      },
      data: {
        status: "APPROVED"
      }
    });

    console.log(`[CronJob] Successfully approved ${updateResult.count} referrals.`);
    return { releasedCount: updateResult.count };

  } catch (error) {
    console.error("[CronJob] Error executing referral release:", error);
    throw error;
  }
}

/**
 * Inicializa un planificador interno simple en segundo plano (cada 24 horas)
 * como alternativa si no hay un scheduler externo de cron.
 */
export function startReferralReleaseScheduler() {
  // Ejecutar al iniciar
  setTimeout(async () => {
    try {
      await releaseReferrals();
    } catch (err) {
      console.error("[CronJob] Initial startup release failed:", err);
    }
  }, 10000); // Esperar 10 segundos para dar tiempo a las conexiones

  // Intervalo de 24 horas (en ms: 24 * 60 * 60 * 1000 = 86400000)
  const INTERVAL_MS = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      await releaseReferrals();
    } catch (err) {
      console.error("[CronJob] Periodic release failed:", err);
    }
  }, INTERVAL_MS);

  console.log("⏰ Internal cron scheduler for releasing referrals registered (24h interval).");
}
