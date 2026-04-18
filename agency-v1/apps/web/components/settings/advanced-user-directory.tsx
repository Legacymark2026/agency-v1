"use client";

import { Users, Search, MoreHorizontal, UserPlus, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { updateUserRole } from "@/actions/admin";
import { useTransition } from "react";
import { toast } from "sonner";

export function AdvancedUserDirectory({ initialUsers, customRoles = [] }: { initialUsers: any[], customRoles?: any[] }) {
    const defaultRoles = customRoles.length > 0 ? customRoles : [
        { id: "admin", name: "Administrador" },
        { id: "manager", name: "Jefe de Ventas" },
        { id: "agent", name: "Agente de Ventas" },
        { id: "viewer", name: "Solo Lectura" }
    ];
    const [isPending, startTransition] = useTransition();

    const handleRoleChange = (userId: string, newRole: string) => {
        startTransition(async () => {
            const res = await updateUserRole(userId, newRole as any);
            if (res.success) {
                toast.success("Rol actualizado exitosamente");
            } else {
                toast.error(res.error || "Error al actualizar el rol");
            }
        });
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-teal-100 text-teal-600 shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Directorio de Usuarios</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-lg">
                            Administra los miembros de tu equipo, asigna roles de acceso y controla su estado dentro del Workspace.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" className="bg-white">
                        <Download className="w-4 h-4 mr-2" /> Exportar
                    </Button>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                        <UserPlus className="w-4 h-4 mr-2" /> Invitar
                    </Button>
                </div>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Buscar por nombre o correo electrónico..." className="pl-9 bg-white border-slate-200" />
                </div>
                <Button variant="outline" className="bg-white text-slate-600">
                    <Filter className="w-4 h-4 mr-2" /> Filtros
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <th className="px-6 py-4 font-semibold">Usuario</th>
                            <th className="px-6 py-4 font-semibold">Rol Asignado</th>
                            <th className="px-6 py-4 font-semibold">Estado</th>
                            <th className="px-6 py-4 font-semibold">Último Acceso</th>
                            <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {initialUsers.map((user) => {
                            const status = user.deactivatedAt ? 'inactive' : (user.emailVerified ? 'active' : 'invited');

                            return (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold border border-slate-300">
                                                {user.name?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{user.name || "Sin Nombre"}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 capitalize border border-slate-200">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' :
                                            status === 'invited' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' :
                                                'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' :
                                                status === 'invited' ? 'bg-amber-500' :
                                                    'bg-slate-400'
                                                }`} />
                                            {status === 'active' ? 'Activo' : status === 'invited' ? 'Invitación Pndte.' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {user._count?.sessions > 0 ? `${user._count.sessions} sesiones` : 'Nunca'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" disabled={isPending}>
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Asignar Rol</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {defaultRoles.map((role: any) => (
                                                    <DropdownMenuItem
                                                        key={role.id}
                                                        onClick={() => handleRoleChange(user.id, role.id)}
                                                        className={user.role === role.id ? "bg-slate-100 font-semibold" : ""}
                                                    >
                                                        {role.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-sm text-slate-500">
                <span>Mostrando 5 de 12 usuarios</span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>Anterior</Button>
                    <Button variant="outline" size="sm">Siguiente</Button>
                </div>
            </div>
        </div>
    );
}
