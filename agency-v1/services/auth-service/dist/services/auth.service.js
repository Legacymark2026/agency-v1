"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const database_1 = require("@agency/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    /**
     * Autenticar usuario y generar JWT + Sesión Prisma
     */
    static async login(input, privateKey) {
        const { email, password, ipAddress, userAgent } = input;
        const user = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.passwordHash) {
            throw new Error("INVALID_CREDENTIALS");
        }
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid) {
            throw new Error("INVALID_CREDENTIALS");
        }
        if (user.deactivatedAt) {
            throw new Error("ACCOUNT_DEACTIVATED");
        }
        // Obtener membresías de compañía
        let companyMemberships = [];
        try {
            const rawMemberships = await database_1.prisma.companyUser.findMany({
                where: { userId: user.id },
                include: { company: { select: { id: true, name: true } } },
            });
            companyMemberships = rawMemberships ?? [];
        }
        catch {
            // Ignorar errores de relación cross-db
        }
        const signKey = privateKey || process.env.JWT_SECRET || "dev-secret-change-me";
        const signOptions = { expiresIn: "24h" };
        if (privateKey) {
            signOptions.algorithm = "RS256";
        }
        const token = jsonwebtoken_1.default.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            globalRole: user.globalRole,
            companies: companyMemberships.map((c) => ({
                companyId: c.companyId,
                roleName: c.roleName,
                companyName: c.company?.name ?? "",
            })),
        }, signKey, signOptions);
        const session = await database_1.prisma.session.create({
            data: {
                userId: user.id,
                sessionToken: token,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                ipAddress: ipAddress ?? null,
                userAgent: userAgent ?? null,
            },
        });
        return {
            token,
            sessionId: session.id,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                globalRole: user.globalRole,
                image: user.image,
            },
        };
    }
    /**
     * Obtener perfil de usuario autenticado
     */
    static async getUserProfile(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                globalRole: true,
                image: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        return user;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map