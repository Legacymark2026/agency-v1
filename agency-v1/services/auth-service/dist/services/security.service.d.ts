export declare class SecurityService {
    /**
     * Genera el secreto TOTP y el código QR Data URL para vincular con Google Authenticator / Authy
     */
    static generate2FA(userId: string, email: string): Promise<{
        secret: string;
        qrCodeUrl: string;
        otpauth: string;
    }>;
    /**
     * Valida el token inicial y activa 2FA para el usuario, entregando 8 códigos de emergencia
     */
    static enable2FA(userId: string, secret: string, token: string, ipAddress?: string, userAgent?: string): Promise<{
        success: boolean;
        backupCodes: string[];
    }>;
    /**
     * Verifica un código TOTP de 6 dígitos o un código de respaldo de emergencia durante el inicio de sesión
     */
    static verify2FA(userId: string, tokenOrBackupCode: string, ipAddress?: string, userAgent?: string): Promise<{
        success: boolean;
        method: string;
        remainingBackupCodes?: undefined;
    } | {
        success: boolean;
        method: string;
        remainingBackupCodes: number;
    }>;
    /**
     * Desactiva 2FA para la cuenta del usuario
     */
    static disable2FA(userId: string, ipAddress?: string, userAgent?: string): Promise<{
        success: boolean;
    }>;
    /**
     * Registra un evento de auditoría de seguridad inmutable
     */
    static recordAuditLog(userId: string, event: string, ipAddress?: string, userAgent?: string, metadata?: any): Promise<void>;
    /**
     * Obtiene los últimos eventos de auditoría de seguridad del usuario
     */
    static getAuditLogs(userId: string, limit?: number): Promise<any>;
}
