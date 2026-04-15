'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// ── Obtener empresa ────────────────────────────────────────────────────────
async function getCompanyId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) throw new Error('No autenticado');
    const cu = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true },
    });
    if (!cu) throw new Error('Sin empresa asignada');
    return cu.companyId;
}

// ── Listas ─────────────────────────────────────────────────────────────────
export async function getMailingLists() {
    try {
        const companyId = await getCompanyId();
        return await prisma.mailingList.findMany({
            where: { companyId },
            include: { _count: { select: { subscribers: true } } },
            orderBy: { createdAt: 'desc' }
        });
    } catch (err: any) {
        if (err?.code === 'P2021') return [];
        return [];
    }
}

export async function createMailingList(name: string, description?: string) {
    try {
        const companyId = await getCompanyId();
        const data = await prisma.mailingList.create({
            data: { name, description, companyId }
        });
        return { success: true, data };
    } catch (err: any) {
        if (err?.code === 'P2021') {
            return { success: false, error: 'La base de datos no está lista. El administrador debe ejecutar: npx prisma migrate deploy' };
        }
        return { success: false, error: err.message || 'Error desconocido' };
    }
}

export async function getListSubscribers(listId: string) {
    try {
        const companyId = await getCompanyId();
        const list = await prisma.mailingList.findFirst({ where: { id: listId, companyId } });
        if (!list) return [];
        return await prisma.mailingListSubscriber.findMany({
            where: { listId, status: 'SUBSCRIBED' }
        });
    } catch {
        return [];
    }
}

// ── Supresión ─────────────────────────────────────────────────────────────
export async function getSuppressionList() {
    try {
        const companyId = await getCompanyId();
        return await prisma.suppressionList.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
    } catch (err: any) {
        if (err?.code === 'P2021') return [];
        return [];
    }
}

export async function addSuppression(email: string, reason: string = 'UNSUBSCRIBED') {
    try {
        const companyId = await getCompanyId();
        const data = await prisma.suppressionList.upsert({
            where: { companyId_email: { companyId, email: email.toLowerCase() } },
            create: { companyId, email: email.toLowerCase(), reason },
            update: {}
        });
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message || 'Error desconocido' };
    }
}
