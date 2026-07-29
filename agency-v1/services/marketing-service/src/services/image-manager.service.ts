import { prisma } from "@agency/database";

export interface RegisterImageInput {
  companyId: string;
  url: string;
  name: string;
  alt?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
}

export class ImageManagerService {
  /**
   * Registrar una imagen cargada para uso en campañas de correo
   */
  static async registerImage(input: RegisterImageInput) {
    const assetName = input.name || `email-image-${Date.now()}`;
    return (prisma as any).mediaAsset.create({
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
  static async getCompanyImages(companyId: string) {
    return (prisma as any).mediaAsset.findMany({
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
  static async deleteImage(imageId: string, companyId: string) {
    return (prisma as any).mediaAsset.deleteMany({
      where: {
        id: imageId,
        companyId
      }
    });
  }
}
