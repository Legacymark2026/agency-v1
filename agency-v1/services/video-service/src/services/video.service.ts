import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "video-service");

export interface CreateRenderJobInput {
  companyId: string;
  projectId?: string;
  templateId?: string;
  outputFormat?: string;
  resolution?: string;
}

export class VideoService {
  /**
   * Obtener proyectos o trabajos de video por empresa
   */
  static async getVideoProjects(companyId: string) {
    return (prisma as any).videoProject.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Crear trabajo de renderizado de video con transacción atómica
   */
  static async createRenderJob(input: CreateRenderJobInput) {
    return prisma.$transaction(async (tx: any) => {
      const job = await tx.videoProject.create({
        data: {
          companyId: input.companyId,
          title: `Render Job ${Date.now()}`,
          outputFormat: input.outputFormat || "MP4",
          resolution: input.resolution || "1080p",
          status: "QUEUED"
        }
      });

      return job;
    });
  }
}
