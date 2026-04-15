import Link from "next/link";
import { ShieldX, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types/auth";

// Mapeo de nombre de rol para mostrar al usuario
const ROLE_NAMES: Record<string, string> = {
    super_admin: "SuperAdmin",
    admin: "ProjectManager",
    content_manager: "Marketing / SEO",
    client_admin: "Ventas",
    client_user: "Creativo",
    guest: "Invitado",
};

export default async function UnauthorizedPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string }>;
}) {
    const session = await auth();
    const role = (session?.user?.role as UserRole) || UserRole.GUEST;
    const roleName = ROLE_NAMES[role] ?? role;
    const params = await searchParams;
    const attemptedPath = params.from ?? "/dashboard";

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="max-w-md w-full mx-auto text-center px-6">
                {/* Icono */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
                        <ShieldX size={40} className="text-red-500" />
                    </div>
                </div>

                {/* Título */}
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Acceso restringido
                </h1>

                {/* Mensaje */}
                <p className="text-slate-500 text-sm mb-1">
                    Tu rol actual (<span className="font-semibold text-slate-700">{roleName}</span>) no tiene
                    permiso para acceder a esta sección.
                </p>
                {attemptedPath && (
                    <p className="text-xs text-gray-400 font-mono bg-gray-50 px-3 py-1.5 rounded-md mb-6 inline-block">
                        {attemptedPath}
                    </p>
                )}

                {/* Separador */}
                <div className="border-t border-gray-100 my-6" />

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/dashboard">
                        <Button className="gap-2 w-full sm:w-auto">
                            <Home size={16} />
                            Ir al Dashboard
                        </Button>
                    </Link>
                    <Link href="javascript:history.back()">
                        <Button variant="outline" className="gap-2 w-full sm:w-auto">
                            <ArrowLeft size={16} />
                            Volver
                        </Button>
                    </Link>
                </div>

                {/* Nota de soporte */}
                <p className="mt-8 text-xs text-gray-400">
                    Si crees que deberías tener acceso a esta sección,
                    contacta a tu administrador para que actualice tus permisos.
                </p>
            </div>
        </div>
    );
}
