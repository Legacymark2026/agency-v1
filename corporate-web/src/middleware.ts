import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifySignedToken } from "@/lib/auth";

/**
 * Proxy Server-Side (Next.js 16) para protección perimetral del Panel de Administración.
 * Se ejecuta en el servidor HTTP antes de que cualquier página, componente o script
 * de administración sea transferido al cliente.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Permitir acceso libre a la pantalla de login administrativo
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // 2. Proteger todas las rutas bajo /admin
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifySignedToken(sessionCookie);

    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      loginUrl.searchParams.set("expired", "1");
      const response = NextResponse.redirect(loginUrl);
      // Limpiar cookie manipulada o expirada
      response.cookies.delete(ADMIN_COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Interceptar rutas de administración excluyendo estáticos y APIs
     */
    "/admin/:path*",
  ],
};
