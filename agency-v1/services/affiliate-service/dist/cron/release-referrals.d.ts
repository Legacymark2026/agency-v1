/**
 * Libera referidos PENDING a APPROVED si ya superaron el periodo de garantía.
 * Por defecto son 15 días, pero se puede configurar.
 */
export declare function releaseReferrals(warrantyDays?: number): Promise<{
    releasedCount: any;
}>;
/**
 * Inicializa un planificador interno simple en segundo plano (cada 24 horas)
 * como alternativa si no hay un scheduler externo de cron.
 */
export declare function startReferralReleaseScheduler(): void;
