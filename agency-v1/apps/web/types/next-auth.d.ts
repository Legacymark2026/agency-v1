import { UserRole, Permission } from "./auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            role: UserRole;
            companyId?: string;          // B-2: ID de la empresa activa del usuario
            permissions?: Permission[];  // B-2: Permisos del usuario en esa empresa
            allowedRoutes?: string[];    // RBAC: Rutas permitidas para roles custom
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: UserRole;
        companyId?: string;
        permissions?: Permission[];
        allowedRoutes?: string[];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role?: UserRole;
        companyId?: string | null;   // B-2: companyId en token
        permissions?: Permission[];  // B-2: permissions en token
        allowedRoutes?: string[];    // RBAC: rutas permitidas para roles custom
    }
}
