import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    // Static files or API routing bypass
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|webmanifest|txt|xml|json|html)$/)
    ) {
        return NextResponse.next();
    }

    // Default locale routing by GeoIP (similar to apps/web)
    if (pathname === '/') {
        const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
        const enCountries = new Set(['US', 'GB', 'CA', 'AU', 'NZ', 'IE']);
        const esCountries = new Set(['ES', 'CO', 'MX', 'AR', 'PE', 'VE', 'CL', 'EC', 'GT', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY']);

        let targetLocale = 'es';
        if (enCountries.has(country)) targetLocale = 'en';
        else if (esCountries.has(country)) targetLocale = 'es';

        const url = req.nextUrl.clone();
        url.pathname = `/${targetLocale}`;
        return NextResponse.redirect(url);
    }

    return intlMiddleware(req);
}

export const config = {
    // Match everything except assets/static files
    matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|images/|videos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|json|html)$).*)"],
};
