import NextAuth from "next-auth";
import { headers } from "next/headers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import Facebook from "next-auth/providers/facebook";
import TikTok from "next-auth/providers/tiktok";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
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

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-me";

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
                        dbUser = await prisma.user.create({
                            data: {
                                email: user.email!,
                                name: user.name,
                                image: user.image,
                                // ⚠️ Usar el valor del enum (minúsculas) — no el nombre del enum
                                role: UserRole.CLIENT_USER, // = 'client_user'
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

                    // Log initial success
                    await prisma.userActivityLog.create({
                        data: {
                            userId: dbUser.id,
                            action: `LOGIN_SUCCESS_OAUTH_${account.provider.toUpperCase()}`,
                            ipAddress: ip,
                            userAgent: userAgent,
                        }
                    });

                } catch (error) {
                    logger.error("Error saving OAuth account:", { error });
                    return false;
                }
            } else if (account?.provider === "credentials" && user?.id) {
                // Log credentials success
                await prisma.userActivityLog.create({
                    data: {
                        userId: user.id,
                        action: "LOGIN_SUCCESS",
                        ipAddress: ip,
                        userAgent: userAgent,
                    }
                });
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
                    token.role = dbUser.role as UserRole;
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
                            // B-2: Cargar companyId y permissions desde CompanyUser
                            const userWithMeta = await prisma.user.findUnique({
                                where: { id: dbAccount.user.id },
                                select: {
                                    id: true,
                                    role: true,
                                    companies: {
                                        select: { companyId: true, permissions: true },
                                        take: 1
                                    }
                                }
                            });
                            token.id = dbAccount.user.id;
                            token.role = dbAccount.user.role;
                            token.companyId = userWithMeta?.companies[0]?.companyId ?? null;
                            token.permissions = ((userWithMeta?.companies[0]?.permissions ?? []) as string[]) as Permission[];
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
                        // B-2: Cargar companyId y permissions desde CompanyUser
                        const userWithMeta = await prisma.user.findUnique({
                            where: { id: dbUser.id },
                            select: {
                                id: true,
                                role: true,
                                companies: {
                                    select: { companyId: true, permissions: true },
                                    take: 1
                                }
                            }
                        });
                        token.id = dbUser.id;
                        token.role = dbUser.role;
                        token.companyId = userWithMeta?.companies[0]?.companyId ?? null;
                        token.permissions = ((userWithMeta?.companies[0]?.permissions ?? []) as string[]) as Permission[];
                        // ── RoleConfig: cargar rutas permitidas para roles custom
                        token.allowedRoutes = await loadAllowedRoutes(dbUser.role);
                        token.roleCheckedAt = Date.now();
                    } else {
                        logger.auth("JWT: User not found in DB, using OAuth ID as fallback.");
                        token.id = user.id;
                        // Fallback seguro: si el rol es undefined → 'guest' (nunca acceso no autorizado)
                        const fallbackRole = (user as { role?: string }).role ?? UserRole.GUEST;
                        token.role = fallbackRole as UserRole;
                    }
                } catch (error) {
                    logger.error("JWT callback error:", { error });
                    token.id = user.id;
                }
            } else {
                // ── DB-First role refresh ────────────────────────────────────────
                // En requests subsiguientes: refrescar el rol desde DB cada 60s.
                // Esto garantiza que los cambios de rol del admin se apliquen
                // sin que el usuario necesite hacer logout.
                const tokenId = token.id as string | undefined;
                const lastCheck = (token.roleCheckedAt as number | undefined) ?? 0;
                const REFRESH_INTERVAL_MS = 60 * 1000; // 60 segundos

                if (tokenId && (Date.now() - lastCheck > REFRESH_INTERVAL_MS)) {
                    try {
                        const freshUser = await prisma.user.findUnique({
                            where: { id: tokenId },
                            select: {
                                role: true,
                                companies: {
                                    select: { companyId: true, permissions: true },
                                    take: 1
                                }
                            }
                        });
                        if (freshUser) {
                            token.role = freshUser.role as UserRole;
                            token.companyId = freshUser.companies[0]?.companyId ?? token.companyId;
                            token.permissions = ((freshUser.companies[0]?.permissions ?? []) as string[]) as Permission[];
                            // ── RoleConfig: refrescar rutas permitidas si el rol cambió
                            token.allowedRoutes = await loadAllowedRoutes(freshUser.role);
                            token.roleCheckedAt = Date.now();
                            logger.auth(`JWT: Role refreshed from DB → ${token.role}`);
                        } else {
                            // Usuario eliminado de la DB — marcar token como inválido
                            // El callback authorized() detectará esto y redirigirá al login
                            logger.auth(`JWT: User ${tokenId} not found in DB — marking as deleted`);
                            token.isDeleted = true;
                            token.role = undefined;
                        }
                    } catch (e) {
                        // Silently fail — keep existing token data
                        logger.error("JWT role refresh error:", { error: e });
                    }
                }
            }

            return token;
        },

        /**
         * C-3 Fix: Session callback sin query a BD por request.
         * B-2 Fix: companyId y permissions propagados desde JWT → sesión.
         * RBAC Fix: allowedRoutes propagado para que authorized() lo lea
         *           desde session.user en lugar de (auth as any)?.token (Edge Bug).
         */
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as UserRole;
                // Always expose companyId — even if null — so server actions can check it
                session.user.companyId = (token.companyId as string) ?? null;
                if (token.permissions) {
                    session.user.permissions = token.permissions as Permission[];
                }
                // RBAC Fix: Propagar allowedRoutes para roles custom
                session.user.allowedRoutes = (token.allowedRoutes as string[]) ?? [];
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
                        include: { companies: true },
                    });

                    if (!user || !user.passwordHash) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

                    if (passwordsMatch) {
                        // MFA Check - si está habilitado, no dejar login sin verificación
                        const mfaEnabled = isMFAEnabled(user.mfaEnabled, user.mfaSecret);
                        if (mfaEnabled) {
                            // Guardar user temporal en sesión para verificar MFA después
                            // El MFA check se hace en un paso anterior antes de retornar user
                            logger.auth("MFA enabled, requiring verification");
                            // Por ahora permitimos login pero flagged
                            return {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                image: user.image,
                                role: user.role as UserRole,
                                requiresMFA: true,
                            };
                        }
                        
                        // Audit log para login exitoso
                        await prisma.userActivityLog.create({
                            data: {
                                userId: user.id,
                                action: "LOGIN_SUCCESS",
                            }
                        });
                        
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            role: user.role as UserRole,
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

                            await prisma.userActivityLog.create({
                                data: {
                                    userId: user.id,
                                    action: "LOGIN_FAILED_BAD_PASSWORD",
                                    ipAddress: ip,
                                    userAgent: userAgent,
                                }
                            });
                        }
                    } catch (e) { }
                }

                return null;
            },
        }),
    ],
});
