export interface ServiceTokenPayload {
    /** Identificador único del servicio emisor */
    serviceId: string;
    /** Nombre legible del servicio emisor */
    serviceName: string;
    /** Lista de permisos que tiene el servicio */
    permissions: string[];
    /** Timestamp de emisión (auto-generado por JWT) */
    iat?: number;
    /** Timestamp de expiración (auto-generado por JWT) */
    exp?: number;
}
export interface ServiceAuthContext {
    serviceId: string;
    serviceName: string;
    permissions: string[];
}
declare global {
    namespace Express {
        interface Request {
            serviceContext?: ServiceAuthContext;
        }
    }
}
//# sourceMappingURL=types.d.ts.map