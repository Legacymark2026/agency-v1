"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const database_1 = require("@agency/database");
const marketing_service_1 = require("./marketing.service");
class QueueService {
    /**
     * Encolar campaña
     */
    static async enqueue(blastId, companyId, priority = 0, scheduledAt) {
        return database_1.prisma.emailBlast.update({
            where: { id: blastId },
            data: {
                status: scheduledAt ? 'SCHEDULED' : 'PENDING',
                scheduledAt: scheduledAt || null,
            }
        });
    }
    /**
     * Desencolar el siguiente
     */
    static async dequeueNext() {
        const next = await database_1.prisma.emailBlast.findFirst({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'asc' }
        });
        if (!next)
            return null;
        await database_1.prisma.emailBlast.update({
            where: { id: next.id },
            data: { status: 'PROCESSING' }
        });
        return next;
    }
    /**
     * Marcar como completado
     */
    static async markCompleted(queueId, result) {
        return database_1.prisma.emailBlast.update({
            where: { id: queueId },
            data: {
                status: 'COMPLETED',
                sent: result.sent || 0,
                failed: result.failed || 0
            }
        });
    }
    /**
     * Marcar como fallido (con retries)
     */
    static async markFailed(queueId, error) {
        const blast = await database_1.prisma.emailBlast.findUnique({ where: { id: queueId } });
        const retryCount = (blast.retryCount || 0) + 1;
        if (retryCount < 3) {
            return database_1.prisma.emailBlast.update({
                where: { id: queueId },
                data: { status: 'PENDING', retryCount }
            });
        }
        return database_1.prisma.emailBlast.update({
            where: { id: queueId },
            data: { status: 'FAILED' }
        });
    }
    /**
     * Estado de la cola
     */
    static async getQueueStatus(companyId) {
        return database_1.prisma.emailBlast.findMany({
            where: { companyId, status: { in: ['PENDING', 'PROCESSING', 'SCHEDULED', 'QUEUED'] } },
            select: { id: true, name: true, status: true, scheduledAt: true }
        });
    }
    /**
     * Procesar cola
     */
    static async processQueue(baseUrl) {
        let item = await this.dequeueNext();
        while (item) {
            try {
                const result = await marketing_service_1.MarketingService.sendEmailBlast(item.id, item.companyId, baseUrl);
                await this.markCompleted(item.id, result);
            }
            catch (error) {
                await this.markFailed(item.id, error);
            }
            item = await this.dequeueNext();
        }
    }
}
exports.QueueService = QueueService;
//# sourceMappingURL=queue.service.js.map