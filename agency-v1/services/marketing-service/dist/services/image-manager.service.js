"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageManagerService = void 0;
const database_1 = require("@agency/database");
class ImageManagerService {
    /**
     * Registrar una imagen cargada para uso en campañas de correo
     */
    static async registerImage(input) {
        const assetName = input.name || `email-image-${Date.now()}`;
        return database_1.prisma.mediaAsset.create({
            data: {
                companyId: input.companyId,
                filename: assetName,
                url: input.url,
                type: "image",
                sizeBytes: input.sizeBytes || 0,
                width: input.width ?? null,
                height: input.height ?? null,
                tags: ["email-campaign", "marketing"],
                isPublic: true,
                metadata: {
                    alt: input.alt || ""
                }
            }
        });
    }
    /**
     * Obtener galería de imágenes disponibles para la empresa
     */
    static async getCompanyImages(companyId) {
        return database_1.prisma.mediaAsset.findMany({
            where: {
                companyId,
                type: "image"
            },
            orderBy: { createdAt: "desc" },
            take: 50
        });
    }
    /**
     * Eliminar una imagen de la galería de la empresa
     */
    static async deleteImage(imageId, companyId) {
        return database_1.prisma.mediaAsset.deleteMany({
            where: {
                id: imageId,
                companyId
            }
        });
    }
}
exports.ImageManagerService = ImageManagerService;
//# sourceMappingURL=image-manager.service.js.map