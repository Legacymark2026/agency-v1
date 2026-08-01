import { prisma } from "@agency/database";
import { MarketingService } from "./marketing.service";

export class QueueService {
  /**
   * Encolar campaña
   */
  static async enqueue(blastId: string, companyId: string, priority: number = 0, scheduledAt?: Date) {
      return (prisma as any).emailBlast.update({
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
      const next = await (prisma as any).emailBlast.findFirst({
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'asc' } 
      });

      if (!next) return null;

      await (prisma as any).emailBlast.update({
          where: { id: next.id },
          data: { status: 'PROCESSING' }
      });

      return next;
  }

  /**
   * Marcar como completado
   */
  static async markCompleted(queueId: string, result: any) {
      return (prisma as any).emailBlast.update({
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
  static async markFailed(queueId: string, error: any) {
      const blast = await (prisma as any).emailBlast.findUnique({ where: { id: queueId } });
      const retryCount = (blast.retryCount || 0) + 1;

      if (retryCount < 3) {
          return (prisma as any).emailBlast.update({
              where: { id: queueId },
              data: { status: 'PENDING', retryCount }
          });
      }

      return (prisma as any).emailBlast.update({
          where: { id: queueId },
          data: { status: 'FAILED' }
      });
  }

  /**
   * Estado de la cola
   */
  static async getQueueStatus(companyId: string) {
      return (prisma as any).emailBlast.findMany({
          where: { companyId, status: { in: ['PENDING', 'PROCESSING', 'SCHEDULED', 'QUEUED'] } },
          select: { id: true, name: true, status: true, scheduledAt: true }
      });
  }

  /**
   * Procesar cola
   */
  static async processQueue(baseUrl: string) {
      let item = await this.dequeueNext();
      while (item) {
          try {
              const result = await MarketingService.sendEmailBlast(item.id, item.companyId, baseUrl);
              await this.markCompleted(item.id, result);
          } catch (error) {
              await this.markFailed(item.id, error);
          }
          item = await this.dequeueNext();
      }
  }
}
