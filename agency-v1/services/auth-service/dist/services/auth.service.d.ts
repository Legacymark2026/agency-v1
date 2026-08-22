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
        sessionId: string;
        user: {
            id: string;
            email: string;
            name: string | null | undefined;
            role: string;
            globalRole: string | null | undefined;
            image: string | null | undefined;
        };
    }>;
    /**
     * Obtener perfil de usuario autenticado
     */
    static getUserProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string | null | undefined;
        role: string;
        globalRole: string | null | undefined;
        image: string | null | undefined;
        createdAt: Date;
    }>;
}
