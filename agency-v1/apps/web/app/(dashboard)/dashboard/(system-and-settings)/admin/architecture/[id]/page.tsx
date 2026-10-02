import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ObjectTabs } from "@/components/crm/object-tabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ObjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const definition = await prisma.customObjectDefinition.findUnique({
        where: { id }
    });

    if (!definition) {
        notFound();
    }

    // Temporary: fetch related data separately to avoid Prisma Client issues
    const fields: any[] = [];
    const relationshipsFrom: any[] = [];
    const relationshipsTo: any[] = [];
    const permissions: any[] = [];

    if (!definition) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/admin/architecture">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{definition.label}</h1>
                    <p className="text-muted-foreground">{definition.description || "Sin descripción"}</p>
                </div>
            </div>

            <ObjectTabs
                definitionId={definition.id}
                fields={fields}
                relationshipsFrom={relationshipsFrom}
                relationshipsTo={relationshipsTo}
                permissions={permissions}
            />
        </div>
    );
}
