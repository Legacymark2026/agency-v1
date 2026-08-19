import { Request, Response, NextFunction } from "express";
export declare class AuthController {
    /**
     * POST /api/auth/login
     */
    static login(req: Request, res: Response, next: NextFunction, privateKey: string | null): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/auth/refresh — Rotación de Refresh Token (RTR)
     */
    static refresh(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/auth/logout-all — Revocación remota de todas las sesiones
     */
    static logoutAll(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/v1/auth/sessions — Obtener lista de sesiones activas en Redis
     */
    static getSessions(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/auth/profile
     */
    static getProfile(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
