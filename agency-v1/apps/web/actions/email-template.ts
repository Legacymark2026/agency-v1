'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// ── Obtener empresa activa ──────────────────────────────────
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

export interface SaveTemplateInput {
    id?: string;
    name: string;
    subject: string;
    htmlBody: string;
    designJson?: any;
    category?: string;
}

// ── Guardar (o actualizar) Plantilla ────────────────────────
export async function saveEmailTemplate(input: SaveTemplateInput) {
    const companyId = await getCompanyId();

    if (input.id) {
        // Update existing template
        return await prisma.emailTemplate.update({
            where: { id: input.id, companyId },
            data: {
                name: input.name,
                subject: input.subject,
                body: input.htmlBody,
                designJson: input.designJson ?? null,
                category: input.category ?? 'MARKETING',
            }
        });
    }

    // Create new template
    return await prisma.emailTemplate.create({
        data: {
            name: input.name,
            subject: input.subject,
            body: input.htmlBody,
            designJson: input.designJson ?? null,
            category: input.category ?? 'MARKETING',
            companyId,
        }
    });
}

// ── Listar Plantillas ────────────────────────────────────────
export async function getEmailTemplates() {
    const companyId = await getCompanyId();
    return await prisma.emailTemplate.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            subject: true,
            category: true,
            createdAt: true,
        }
    });
}

// ── Obtener una Plantilla Específica ─────────────────────────
export async function getEmailTemplateData(id: string) {
    const companyId = await getCompanyId();
    const tpl = await prisma.emailTemplate.findUnique({
        where: { id, companyId }
    });
    if (!tpl) throw new Error('Plantilla no encontrada');
    return tpl;
}

// ── Eliminar Plantilla ───────────────────────────────────────
export async function deleteEmailTemplate(id: string) {
    const companyId = await getCompanyId();
    await prisma.emailTemplate.delete({
        where: { id, companyId }
    });
    return { success: true };
}
