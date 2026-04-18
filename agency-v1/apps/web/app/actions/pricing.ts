"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getCompanyId(userId: string): Promise<string> {
    const companyUser = await prisma.companyUser.findFirst({
        where: { userId },
        select: { companyId: true }
    });
    if (!companyUser) {
        throw new Error("User does not belong to any company");
    }
    return companyUser.companyId;
}

export async function getServicePrices() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const companyId = await getCompanyId(session.user.id);
        const services = await prisma.servicePrice.findMany({
            where: { companyId },
            orderBy: [
              { orderIndex: 'asc' },
              { createdAt: 'desc' }
            ]
        });
        return services;
    } catch (error) {
        console.error("Error fetching service prices:", error);
        return [];
    }
}

export async function createServicePrice(data: {
    codigo_id: string | null;
    nombre_servicio: string;
    categoria: string;
    tipo_formato: string | null;
    tiempo_estimado: string | null;
    herramientas: string | null;
    descripcion: string;
    precio_base: number;
    iva_porcentaje: number;
    retefuente_porc: number;
    reteiva_porc: number;
    ica_porc: number;
    precio_urgente: number | null;
    isExpress: boolean;
    estado: string;
    orderIndex?: number;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyId = await getCompanyId(session.user.id);

    const service = await prisma.servicePrice.create({
        data: {
            ...data,
            companyId
        }
    });

    revalidatePath("/dashboard/marketing/pricing");
    return service;
}

export async function updateServicePrice(id: string, data: {
    codigo_id: string | null;
    nombre_servicio: string;
    categoria: string;
    tipo_formato: string | null;
    tiempo_estimado: string | null;
    herramientas: string | null;
    descripcion: string;
    precio_base: number;
    iva_porcentaje: number;
    retefuente_porc: number;
    reteiva_porc: number;
    ica_porc: number;
    precio_urgente: number | null;
    isExpress: boolean;
    estado: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Protect cross-company updates
    const companyId = await getCompanyId(session.user.id);
    const existing = await prisma.servicePrice.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) throw new Error("Not found or unauthorized");

    const updated = await prisma.servicePrice.update({
        where: { id },
        data
    });

    revalidatePath("/dashboard/marketing/pricing");
    return updated;
}

export async function deleteServicePrice(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyId = await getCompanyId(session.user.id);
    const existing = await prisma.servicePrice.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) throw new Error("Not found or unauthorized");

    await prisma.servicePrice.delete({
        where: { id }
    });

    revalidatePath("/dashboard/marketing/pricing");
    return { success: true };
}

export async function reorderServicePrices(updates: { id: string, orderIndex: number }[]) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyId = await getCompanyId(session.user.id);

    // Using transaction for atomic multi-row updates
    await prisma.$transaction(
        updates.map(update => 
            prisma.servicePrice.update({
                where: { 
                    id: update.id,
                    companyId // Extra safety
                },
                data: { orderIndex: update.orderIndex }
            })
        )
    );

    revalidatePath("/dashboard/marketing/pricing");
    return { success: true };
}

export async function bulkDeleteServicePrices(ids: string[]) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyId = await getCompanyId(session.user.id);

    await prisma.servicePrice.deleteMany({
        where: {
            id: { in: ids },
            companyId
        }
    });

    revalidatePath("/dashboard/marketing/pricing");
    return { success: true };
}

export async function bulkUpdateServicePricesStatus(ids: string[], estado: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const companyId = await getCompanyId(session.user.id);

    await prisma.servicePrice.updateMany({
        where: {
            id: { in: ids },
            companyId
        },
        data: { estado }
    });

    revalidatePath("/dashboard/marketing/pricing");
    return { success: true };
}
