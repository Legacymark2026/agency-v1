export interface RegisterImageInput {
    companyId: string;
    url: string;
    name: string;
    alt?: string;
    sizeBytes?: number;
    width?: number;
    height?: number;
}
export declare class ImageManagerService {
    /**
     * Registrar una imagen cargada para uso en campañas de correo
     */
    static registerImage(input: RegisterImageInput): Promise<any>;
    /**
     * Obtener galería de imágenes disponibles para la empresa
     */
    static getCompanyImages(companyId: string): Promise<any>;
    /**
     * Eliminar una imagen de la galería de la empresa
     */
    static deleteImage(imageId: string, companyId: string): Promise<any>;
}
