import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Crear middleware de next-intl
const intlMiddleware = createIntlMiddleware(routing);

// Obtener la función auth de NextAuth
const { auth } = NextAuth(authConfig);

// Combinar ambos middlewares
export default auth(function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    // Si es una ruta de API o Auth, dejamos que NextAuth se encargue
    const isApiOrAuth = pathname.startsWith("/api") || pathname.startsWith("/auth") || pathname.startsWith("/_next");
    if (isApiOrAuth) {
        const response = NextResponse.next();
        
        // CORS preventivo básico para APIs
        if (pathname.startsWith("/api")) {
            response.headers.set('Access-Control-Allow-Origin', '*'); // Or strict domain if needed
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-device-id');
        }
        
        return response;
    }

    // ── DASHBOARD: el authorized() callback de NextAuth YA verifica permisos.
    // NO hacer NextResponse.next() aquí — eso bypasaría el RBAC.
    // auth() wrapper aplica authorized() antes de llegar a este handler.
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
        return NextResponse.next();
    }

    // Para todo lo demás (marketing), aplicamos Next-Intl.
    // === GEO-IP ROUTING para SEO Internacional ===
    if (pathname === '/') {
        const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
        const enCountries = new Set(['US', 'GB', 'CA', 'AU', 'NZ', 'IE']);
        const esCountries = new Set(['ES', 'CO', 'MX', 'AR', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'GQ']);

        let targetLocale = 'es';
        if (enCountries.has(country)) targetLocale = 'en';
        else if (esCountries.has(country)) targetLocale = 'es';

        const url = req.nextUrl.clone();
        url.pathname = `/${targetLocale}`;
        return NextResponse.redirect(url);
    }

    return intlMiddleware(req);
} as any);
export const config = {
    // Ignorar estáticos
    matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|images/|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|json|html)$).*)"],
};
