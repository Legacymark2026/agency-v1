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

  // 1. Permitir acceso libre a la pantalla de login administrativo y autenticación
  if (pathname === "/admin/login" || pathname === "/api/admin/auth") {
    return NextResponse.next();
  }

  // 2. Protección perimetral para endpoints API administrativos
  if (pathname.startsWith("/api/admin")) {
    // 2.1 Verificación defensiva contra CSRF en peticiones mutantes (POST, PUT, DELETE, PATCH)
    const method = request.method.toUpperCase();
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      const secFetchSite = request.headers.get("sec-fetch-site");
      if (secFetchSite && secFetchSite === "cross-site") {
        return NextResponse.json(
          { error: "Petición rechazada por política defensiva Same-Origin (CSRF detectado)" },
          { status: 403 }
        );
      }
    }

    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const session = await verifySignedToken(sessionCookie);
    if (!session) {
      const response = NextResponse.json({ error: "Sesión inválida o expirada" }, { status: 401 });
      response.cookies.delete(ADMIN_COOKIE_NAME);
      return response;
    }
    return NextResponse.next();
  }

  // 3. Proteger todas las rutas bajo /admin (páginas)
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
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
