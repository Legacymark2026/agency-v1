export interface LoginInput {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
}
export declare class AuthService {
    /**
     * Autenticar usuario y generar JWT + Sesión Prisma
     */
    static login(input: LoginInput, privateKey: string | null): Promise<{
        token: string;
        sessionId: any;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            globalRole: any;
            image: any;
        };
    }>;
    /**
     * Obtener perfil de usuario autenticado
     */
    static getUserProfile(userId: string): Promise<any>;
}
