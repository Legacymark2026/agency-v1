import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import Facebook from "next-auth/providers/facebook";
import TikTok from "next-auth/providers/tiktok";
import GitHub from "next-auth/providers/github";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig, GLOBAL_SUPERADMIN_EMAILS } from "@/auth.config";
import type { Permission } from "@/types/auth";
import { UserRole } from "@/types/auth";
import { logger } from "@/lib/logger";
import { getRoleAllowedRoutes } from "@/lib/role-config";
import { isStandardRole } from "@/lib/rbac";
import { verifyToken, isMFAEnabled } from "@/lib/mfa";

/** Carga las rutas permitidas para un rol custom desde la BD */
async function loadAllowedRoutes(role: string): Promise<string[]> {
    if (isStandardRole(role)) return []; // roles estándar no usan allowedRoutes
    const routes = await getRoleAllowedRoutes(role);
    return routes ?? [];
}


const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

/**
 * C-2 Fix: Email alias resuelto desde variables de entorno.
 * Nunca hardcodear emails en el código fuente.
 */
function resolveAdminAlias(email: string | null | undefined): string | null {
    const alias = process.env.ADMIN_OAUTH_EMAIL_ALIAS;
    const canonical = process.env.ADMIN_CANONICAL_EMAIL;
    if (alias && canonical && email === alias) return canonical;
    return null;
}

const authSecret = (() => {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
        // Permitir compilación estática de Next.js (next build) sin fallar
        if (process.env.NEXT_PHASE === "phase-production-build" || process.env.npm_lifecycle_event === "build") {
            return "build-dummy-auth-secret-32-characters-minimum-for-compilation!";
        }
        if (process.env.NODE_ENV === "production") {
            // Si está en tiempo de ejecución en producción pero no se configuró la variable
            return "build-dummy-auth-secret-32-characters-minimum-for-compilation!";
        }
        return "legacymark-dev-ephemeral-auth-secret-32-chars-min!";
    }
    return secret;
})();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// @ts-ignore — next-auth v5 beta: 'auth' combined declaration conflict (known issue)
export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    secret: authSecret,
    trustHost: true,
    pages: {
        ...authConfig?.pages,
        signIn: "/auth/login",
    },
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account }) {
            logger.auth("signIn callback triggered");
            logger.auth("Provider:", { provider: account?.provider });

            let ip = "Unknown IP";
            let userAgent = "Unknown Device";
            try {
                const { headers } = await import("next/headers");
                const headersList = await headers();
                ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "Unknown IP";
                userAgent = headersList.get("user-agent") || "Unknown Device";
            } catch (e) {
                // headers() may throw if called outside of request context
            }

            // Para providers OAuth, guardar el account en BD
            if (account && account.provider !== "credentials") {
                logger.auth("Processing OAuth provider:", { provider: account.provider });

                try {
                    // Buscar usuario existente
                    let dbUser = await prisma.user.findUnique({
                        where: { email: user.email! },
                    });

                    // C-2: Resolver alias desde env vars (no hardcodeado)
                    if (!dbUser) {
                        const aliasEmail = resolveAdminAlias(user.email);
                        if (aliasEmail) {
                            logger.auth("Resolving admin alias to canonical email...");
                            dbUser = await prisma.user.findUnique({
                                where: { email: aliasEmail },
                            });
                        }
                    }

                    // Crear usuario si no existe
                    if (!dbUser) {
                        logger.auth("Creating new user...");
                        const isSuperAdminEmail = user.email && GLOBAL_SUPERADMIN_EMAILS.includes(user.email.toLowerCase());
                        dbUser = await prisma.user.create({
                            data: {
                                email: user.email!,
                                name: user.name,
                                image: user.image,
                                role: isSuperAdminEmail ? UserRole.SUPER_ADMIN : UserRole.CLIENT_USER,
                            },
                        });
                        logger.auth("User created:", { userId: dbUser.id });
                    }

                    // Verificar si la cuenta OAuth ya existe
                    const existingAccount = await prisma.account.findUnique({
                        where: {
                            provider_providerAccountId: {
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                            },
                        },
                    });

                    if (!existingAccount) {
                        await prisma.account.create({
                            data: {
                                userId: dbUser.id,
                                type: account.type,
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                                refresh_token: account.refresh_token,
                                access_token: account.access_token,
                                expires_at: account.expires_at,
                                token_type: account.token_type,
                                scope: account.scope,
                                id_token: account.id_token,
                            },
                        });
                        logger.auth("OAuth account linked successfully.");
                    } else {
                        logger.auth("Account already linked, skipping.");
                    }

                    // Log initial success (fire-and-forget)
                    try {
                        await (prisma as any).userActivityLog.create({
                            data: {
                                userId: dbUser.id,
                                action: `LOGIN_SUCCESS_OAUTH_${account.provider.toUpperCase()}`,
                                ipAddress: ip,
                                userAgent: userAgent,
                            }
                        });
                    } catch (e) { /* non-critical */ }

                } catch (error) {
                    logger.error("Error saving OAuth account:", { error });
                    return false;
                }
            } else if (account?.provider === "credentials" && user?.id) {
                // Log credentials success (fire-and-forget)
                try {
                    await (prisma as any).userActivityLog.create({
                        data: {
                            userId: user.id,
                            action: "LOGIN_SUCCESS",
                            ipAddress: ip,
                            userAgent: userAgent,
                        }
                    });
                } catch (e) { /* non-critical */ }
            }

            return true;
        },

        async jwt({ token, user, account, trigger, session }) {


            if (trigger === "update") {
                const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
                if (dbUser) {
                    token.name = dbUser.name;
                    token.email = dbUser.email;
                    token.picture = dbUser.image;
                    const isSuperAdminEmail = dbUser.email && GLOBAL_SUPERADMIN_EMAILS.includes(dbUser.email.toLowerCase());
                    token.role = isSuperAdminEmail ? UserRole.SUPER_ADMIN : (dbUser.role as UserRole);
                }
            }
            // Solo en el sign-in inicial (cuando `user` está presente)
            if (user) {
                logger.auth("JWT Callback — Initial sign-in, resolving DB user...");

                try {
                    // 1. Prioridad: Buscar por account OAuth vinculado
                    if (account) {
                        const dbAccount = await prisma.account.findUnique({
                            where: {
                                provider_providerAccountId: {
                                    provider: account.provider,
                                    providerAccountId: account.providerAccountId,
                                },
                            },
                            include: { user: true },
                        });

                        if (dbAccount?.user) {
                            logger.auth("JWT: Resolved via linked OAuth account →", { email: dbAccount.user.email });
                            // Fetch companyUser from CORE DB separately (no cross-DB include)
                            let companyId: string | null = null;
                            let permissions: string[] = [];
                            try {
                                const membership = await (prisma as any).companyUser.findFirst({
                                    where: { userId: dbAccount.user.id },
                                    select: { companyId: true, permissions: true },
                                });
                                companyId = membership?.companyId ?? null;
                                permissions = (membership?.permissions as string[]) ?? [];
                            } catch (e) { /* non-critical */ }
                            token.id = dbAccount.user.id;
                            const isSuperAdminEmail = dbAccount.user.email && GLOBAL_SUPERADMIN_EMAILS.includes(dbAccount.user.email.toLowerCase());
                            token.role = isSuperAdminEmail ? UserRole.SUPER_ADMIN : dbAccount.user.role;
                            token.companyId = companyId;
                            token.permissions = permissions as Permission[];
                            // ── RoleConfig: cargar rutas permitidas para roles custom
                            token.allowedRoutes = await loadAllowedRoutes(dbAccount.user.role);
                            token.roleCheckedAt = Date.now();
                            return token;
                        }
                    }

                    // 2. Fallback: Buscar por email
                    let dbUser = await prisma.user.findUnique({
                        where: { email: user.email! },
                    });

                    // C-2: Resolver alias desde env var
                    if (!dbUser) {
                        const aliasEmail = resolveAdminAlias(user.email);
                        if (aliasEmail) {
                            dbUser = await prisma.user.findUnique({
                                where: { email: aliasEmail },
                            });
                        }
                    }

                    if (dbUser) {
                        // Fetch companyUser from CORE DB separately (no cross-DB include)
                        let companyId: string | null = null;
                        let permissions: string[] = [];
                        try {
                            const membership = await (prisma as any).companyUser.findFirst({
                                where: { userId: dbUser.id },
                                select: { companyId: true, permissions: true },
                            });
                            companyId = membership?.companyId ?? null;
                            permissions = (membership?.permissions as string[]) ?? [];
                        } catch (e) { /* non-critical */ }
                        token.id = dbUser.id;
                        const isSuperAdminEmail = dbUser.email && GLOBAL_SUPERADMIN_EMAILS.includes(dbUser.email.toLowerCase());
                        token.role = isSuperAdminEmail ? UserRole.SUPER_ADMIN : dbUser.role;
                        token.companyId = companyId;
                        token.permissions = permissions as Permission[];
                        // ── RoleConfig: cargar rutas permitidas para roles custom
                        token.allowedRoutes = await loadAllowedRoutes(dbUser.role);
                        token.roleCheckedAt = Date.now();
                    } else {
                        logger.auth("JWT: User not found in DB, using OAuth ID as fallback.");
                        token.id = user.id;
                        const isSuperAdminEmail = user.email && GLOBAL_SUPERADMIN_EMAILS.includes(user.email.toLowerCase());
                        const fallbackRole = isSuperAdminEmail ? UserRole.SUPER_ADMIN : ((user as { role?: string }).role ?? UserRole.GUEST);
                        token.role = fallbackRole as UserRole;
                    }
                } catch (error) {
                    logger.error("JWT callback error:", { error });
                    token.id = user.id;
                }
            } else {
                // ── DB-First role refresh ────────────────────────────────────────
                // En requests subsiguientes: refrescar el rol desde DB cada 60s.
                const tokenId = token.id as string | undefined;
                const lastCheck = (token.roleCheckedAt as number | undefined) ?? 0;
                const REFRESH_INTERVAL_MS = 60 * 1000; // 60 segundos

                if (tokenId && (Date.now() - lastCheck > REFRESH_INTERVAL_MS)) {
                    try {
                        const freshUser = await prisma.user.findUnique({
                            where: { id: tokenId },
                            select: { email: true, role: true }
                        });
                        if (freshUser) {
                            // Fetch companyUser from CORE DB separately
                            let companyId: string | null = token.companyId as string ?? null;
                            let permissions: string[] = (token.permissions as string[]) ?? [];
                            try {
                                const membership = await (prisma as any).companyUser.findFirst({
                                    where: { userId: tokenId },
                                    select: { companyId: true, permissions: true },
                                });
                                if (membership) {
                                    companyId = membership.companyId ?? null;
                                    permissions = (membership.permissions as string[]) ?? [];
                                }
                            } catch (e) { /* non-critical */ }
                            const isSuperAdminEmail = freshUser.email && GLOBAL_SUPERADMIN_EMAILS.includes(freshUser.email.toLowerCase());
                            token.role = isSuperAdminEmail ? UserRole.SUPER_ADMIN : (freshUser.role as UserRole);
                            token.companyId = companyId;
                            token.permissions = permissions as Permission[];
                            // ── RoleConfig: refrescar rutas permitidas si el rol cambió
                            token.allowedRoutes = await loadAllowedRoutes(freshUser.role);
                            token.roleCheckedAt = Date.now();
                            logger.auth(`JWT: Role refreshed from DB → ${token.role}`);
                        } else {
                            // Usuario eliminado de la DB — marcar token como inválido
                            logger.auth(`JWT: User ${tokenId} not found in DB — marking as deleted`);
                            token.isDeleted = true;
                            token.role = undefined;
                        }
                    } catch (e) {
                        logger.error("JWT role refresh error:", { error: e });
                    }
                }
            }

            // Prune bloated properties to avoid massive session cookies
            if (typeof token.picture === "string" && token.picture.length > 2000) {
                token.picture = null;
            }
            if (typeof token.image === "string" && token.image.length > 2000) {
                token.image = null;
            }

            return token;
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                const isSuperAdminEmail = token.email && GLOBAL_SUPERADMIN_EMAILS.includes((token.email as string).toLowerCase());
                session.user.role = isSuperAdminEmail ? UserRole.SUPER_ADMIN : (token.role as UserRole);
                // Always expose companyId — even if null — so server actions can check it
                session.user.companyId = (token.companyId as string) ?? null;
                if (token.permissions) {
                    session.user.permissions = token.permissions as Permission[];
                }
                // RBAC Fix: Propagar allowedRoutes para roles custom
                session.user.allowedRoutes = (token.allowedRoutes as string[]) ?? [];
                session.user.isDeleted = token.isDeleted as boolean | undefined;
            }
            return session;
        },
    },
    providers: [
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })] : []),
        ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET ? [LinkedIn({
            clientId: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        })] : []),
        ...( (process.env.META_APP_ID || process.env.FACEBOOK_CLIENT_ID) && (process.env.META_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET) ? [Facebook({
            clientId: process.env.META_APP_ID || process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.META_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "public_profile email pages_show_list pages_read_engagement pages_manage_metadata pages_messaging ads_read leads_retrieval instagram_basic instagram_manage_messages",
                },
            },
        })] : []),
        ...(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET ? [TikTok({
            clientId: process.env.TIKTOK_CLIENT_KEY,
            clientSecret: process.env.TIKTOK_CLIENT_SECRET,
        })] : []),
        ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? [GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        })] : []),
        ...((process.env.MICROSOFT_CLIENT_ID || process.env.AZURE_AD_CLIENT_ID) && (process.env.MICROSOFT_CLIENT_SECRET || process.env.AZURE_AD_CLIENT_SECRET) ? [MicrosoftEntraID({
            clientId: process.env.MICROSOFT_CLIENT_ID || process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET || process.env.AZURE_AD_CLIENT_SECRET,
            issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || process.env.AZURE_AD_TENANT_ID || "common"}/v2.0`,
        })] : []),
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsedCredentials = signInSchema.safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    const user = await prisma.user.findUnique({
                        where: { email },
                    });

                    if (!user || !user.passwordHash) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

                    if (passwordsMatch) {
                        const isSuperAdminEmail = email.toLowerCase() === "administrador@legacymarksas.com";
                        const assignedRole = isSuperAdminEmail ? UserRole.SUPER_ADMIN : (user.role as UserRole);

                        // MFA Check
                        const mfaEnabled = isMFAEnabled(user.mfaEnabled, user.mfaSecret);
                        if (mfaEnabled) {
                            logger.auth("MFA enabled, requiring verification");
                            return {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                image: user.image,
                                role: assignedRole,
                                requiresMFA: true,
                            };
                        }
                        
                        // Audit log para login exitoso (fire-and-forget)
                        try {
                            await (prisma as any).userActivityLog.create({
                                data: {
                                    userId: user.id,
                                    action: "LOGIN_SUCCESS",
                                }
                            });
                        } catch (e) { /* non-critical */ }
                        
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            role: assignedRole,
                        };
                    }
                }

                logger.warn("Invalid credentials attempt.");

                if (parsedCredentials.success) {
                    try {
                        const { email } = parsedCredentials.data;
                        const user = await prisma.user.findUnique({ where: { email } });
                        if (user) {
                            let ip = "Unknown IP";
                            let userAgent = "Unknown Device";
                            try {
                                const headersList = await headers();
                                ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "Unknown IP";
                                userAgent = headersList.get("user-agent") || "Unknown Device";
                            } catch (e) { }

                            try {
                                await (prisma as any).userActivityLog.create({
                                    data: {
                                        userId: user.id,
                                        action: "LOGIN_FAILED_BAD_PASSWORD",
                                        ipAddress: ip,
                                        userAgent: userAgent,
                                    }
                                });
                            } catch (e) { }
                        }
                    } catch (e) { }
                }

                return null;
            },
        }),
    ],
});
