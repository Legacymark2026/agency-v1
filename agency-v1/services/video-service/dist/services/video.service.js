"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoService = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "video-service");
class VideoService {
    /**
     * Obtener proyectos o trabajos de video por empresa
     */
    static async getVideoProjects(companyId) {
        return database_1.prisma.videoProject.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" }
        });
    }
    /**
     * Crear trabajo de renderizado de video con transacción atómica
     */
    static async createRenderJob(input) {
        return database_1.prisma.$transaction(async (tx) => {
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
exports.VideoService = VideoService;
//# sourceMappingURL=video.service.js.map