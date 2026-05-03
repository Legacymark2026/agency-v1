import type { NextAuthConfig } from "next-auth";
import type { UserRole } from '@/types/auth';
import { canAccessRoute, isPublicRoute } from "@/lib/rbac";
import { NextResponse } from "next/server";

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-me";

export const authConfig: NextAuthConfig = {
    secret: authSecret,
    debug: true,
    trustHost: true,
    
    // SESSION HARDENING - Security Best Practices
    session: {
        strategy: "jwt",
        maxAge: 30 * 60, // 30 minutes in seconds
    },
    
    pages: {
        signIn: "/auth/login",
        error: "/auth/error",
        verifyRequest: "/auth/verify-request",
        newUser: "/auth/register",
    },
    callbacks: {
        async signIn() {
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user.role as UserRole) || 'guest';
                token.companyId = user.companyId;
                token.permissions = user.permissions;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                if (token.role) {
                    session.user.role = token.role as UserRole;
                }
                if (token.companyId) {
                    session.user.companyId = token.companyId as string;
                }
                session.user.permissions = token.permissions as import("@/types/auth").Permission[] | undefined;
                // Propagar allowedRoutes al cliente para el sidebar
                session.user.allowedRoutes = (token.allowedRoutes as string[]) ?? [];
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const pathname = nextUrl.pathname;

            // Rutas públicas → siempre OK
            if (isPublicRoute(pathname)) return true;

            // Página de espera → accesible si está logueado
            if (pathname.startsWith('/auth/pending-approval')) return isLoggedIn;

            // No autenticado → redirect a login
            if (!isLoggedIn) return false;

            // ── Usuario eliminado ────────────────────────────────────────
            const isDeleted = (auth?.user as any)?.isDeleted;
            if (isDeleted) {
                const loginUrl = new URL('/auth/login?deleted=1', nextUrl.origin);
                return NextResponse.redirect(loginUrl);
            }

            // ── MFA Verification ────────────────────────────────────────
            const mfaVerified = (auth?.user as any)?.mfaVerified;
            // Si el usuario requiere MFA y no está verificado
            if (mfaVerified === false) {
                // Permitimos acceso a /auth/mfa-verify o logout
                if (pathname.startsWith('/auth/mfa-verify') || pathname.startsWith('/api/auth/signout')) {
                    return true;
                }
                // Redirigir a verificar MFA
                const mfaUrl = new URL('/auth/mfa-verify', nextUrl.origin);
                return NextResponse.redirect(mfaUrl);
            } else if (pathname.startsWith('/auth/mfa-verify')) {
                // Si ya verificó, no necesita estar en mfa-verify
                const dashUrl = new URL('/dashboard', nextUrl.origin);
                return NextResponse.redirect(dashUrl);
            }

            // Protección de rutas del dashboard
            if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
                const role = (auth?.user?.role as string) || 'guest';

                // GUEST → redirige a pending-approval
                if (role === 'guest') {
                    const pendingUrl = new URL('/auth/pending-approval', nextUrl.origin);
                    return NextResponse.redirect(pendingUrl);
                }

                // Para roles custom: leer allowedRoutes desde session.user
                // (NO desde token — no accesible en Edge Runtime de NextAuth v5)
                const allowedRoutes = (auth?.user?.allowedRoutes as string[]) ?? [];

                return canAccessRoute(pathname, role as UserRole, allowedRoutes);
            }

            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
