import { getCustomObjectDefinitions } from "@/modules/crm/actions/crm";
import OrganizationCanvas from "@/components/organization/organization-canvas";
import { Button } from "@/components/ui/button";
import { Plus, Database } from "lucide-react";
import { CreateTeamDialog } from "@/modules/crm/components/create-team-dialog";
import { CreateObjectDialog } from "@/modules/crm/components/create-object-dialog";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ArchitecturePage() {
    const session = await auth();
    const user = session?.user;

    // Fetch user's company
    const companyUser = user?.id ? await prisma.companyUser.findFirst({
        where: { userId: user.id }
    }) : null;

    // Fallback to a default company if no relation found (for dev/initial seed)
    // or just use what we found. 
    // Ideally we should handle the 'no company' case gracefully.
    const companyId = companyUser?.companyId;

    const customObjects = await getCustomObjectDefinitions();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Arquitectura Empresarial</h1>
                    <p className="text-muted-foreground">Gestión de jerarquías de equipos y objetos personalizados.</p>
                </div>
                <CreateTeamDialog
                    companyId={companyId}
                    triggerButton={
                        <Button disabled={!companyId} title={!companyId ? "No company assigned" : ""}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Equipo Raíz
                        </Button>
                    }
                />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <h2 className="text-lg font-semibold mb-4 text-slate-200">Mapa Organizacional (Jerarquía)</h2>
                    <p className="text-sm text-slate-400 mb-4">
                        Visualiza y re-asigna equipos arrastrando y soltando las conexiones.
                    </p>
                    {companyId ? (
                        <OrganizationCanvas companyId={companyId} />
                    ) : (
                        <div className="h-[750px] w-full bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                            Asigna una empresa para empezar a crear la estructura.
                        </div>
                    )}
                </div>

                <div className="xl:col-span-1">
                    <h2 className="text-lg font-semibold mb-4 text-slate-200">Objetos Personalizados</h2>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-[0_0_15px_rgba(20,184,166,0.05)]">
                        <div className="p-3 bg-teal-950/50 rounded-full border border-teal-500/20">
                            <Database className="h-6 w-6 text-teal-400" />
                        </div>
                        <div>
                            <h3 className="font-medium">Definiciones de Objetos</h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                Crea esquemas para Deals, Tickets, o Inventario personalizados.
                            </p>
                        </div>

                        <div className="w-full">
                            {companyId ? (
                                <CreateObjectDialog companyId={companyId} />
                            ) : (
                                <p className="text-xs text-red-500">Asigna una empresa a tu usuario para crear objetos.</p>
                            )}
                        </div>

                        <div className="w-full pt-4 border-t border-slate-800 text-left space-y-2">
                            {customObjects.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center">No hay objetos definidos.</p>
                            ) : customObjects.map(obj => (
                                <Link key={obj.id} href={`/dashboard/admin/architecture/${obj.id}`}>
                                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-teal-500/50 hover:bg-slate-800/50 cursor-pointer transition-colors group">
                                        <span className="font-medium text-sm text-slate-200 group-hover:text-teal-400">{obj.name}</span>
                                        {obj.description && <span className="text-xs text-slate-500 ml-2">{obj.description}</span>}
                                        <span className="ml-auto text-xs bg-teal-950 text-teal-400 border border-teal-500/30 px-2 py-1 rounded-full">Activo</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
