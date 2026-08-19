export declare class BruteForceService {
    /**
     * Verifica si la IP o la cuenta de usuario se encuentra bloqueada por intentos fallidos
     */
    static checkLockout(ip: string, email: string): Promise<{
        isLocked: boolean;
        remainingMinutes?: undefined;
        remainingSeconds?: undefined;
        message?: undefined;
    } | {
        isLocked: boolean;
        remainingMinutes: number;
        remainingSeconds: number;
        message: string;
    }>;
    /**
     * Incrementa el contador de intentos fallidos en Redis con expiración de 15 minutos
     */
    static recordFailedAttempt(ip: string, email: string): Promise<void>;
    /**
     * Resetea el contador de intentos fallidos tras un inicio de sesión exitoso
     */
    static resetLockout(ip: string, email: string): Promise<void>;
}
