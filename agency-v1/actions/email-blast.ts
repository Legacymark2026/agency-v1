'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

import { Resend } from 'resend';

// Lazy getter — avoids running Resend() at module level during Next.js build
function getResend() {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY not configured');
    return new Resend(key);
}

export interface RecipientInput {
    email: string;
    name?: string;
    [key: string]: string | undefined;
}

export interface CreateEmailBlastInput {
    name: string;
    subject: string;
    htmlBody: string;
    designJson?: any;
    isAbTest?: boolean;
    subjectB?: string;
    htmlBodyB?: string;
    fromName?: string;
    fromEmail?: string;
    scheduledAt?: Date | null;
    recipients: RecipientInput[];
}

// ── Obtener empresas activas del usuario ──────────────────────────────────

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

// ── Crear un blast (guardarlo en BD como DRAFT o QUEUED si está programado) ──

export async function createEmailBlast(input: CreateEmailBlastInput) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('No autenticado');
    const companyId = await getCompanyId();

    const blast = await prisma.emailBlast.create({
        data: {
            name: input.name,
            subject: input.subject,
            htmlBody: input.htmlBody,
            designJson: input.designJson ?? null,
            isAbTest: input.isAbTest ?? false,
            subjectB: input.subjectB ?? null,
            htmlBodyB: input.htmlBodyB ?? null,
            fromName: input.fromName ?? 'LegacyMark',
            fromEmail: input.fromEmail ?? 'noreply@legacymarksas.com',
            status: input.scheduledAt ? 'QUEUED' : 'DRAFT',
            scheduledAt: input.scheduledAt ?? null,
            totalRecipients: input.recipients.length,
            companyId,
            createdById: session.user.id,
            recipients: {
                create: input.recipients.map((r, i) => ({
                    email: r.email,
                    name: r.name,
                    variant: input.isAbTest ? (i % 2 === 0 ? 'A' : 'B') : 'A',
                    variables: Object.fromEntries(
                        Object.entries(r).filter(([k]) => !['email', 'name'].includes(k))
                    ),
                    status: 'PENDING',
                })),
            },
        },
        include: { recipients: true },
    });

    return blast;
}

// ── Obtener lista de blasts de la empresa ─────────────────────────────────

export async function getEmailBlasts() {
    const companyId = await getCompanyId();

    const blasts = await prisma.emailBlast.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            subject: true,
            status: true,
            totalRecipients: true,
            sent: true,
            failed: true,
            sentAt: true,
            createdAt: true,
            createdById: true,
        },
    });

    // Resolve creator names
    const userIds = Array.from(new Set(blasts.map((b) => b.createdById).filter(Boolean)));
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name || u.email || 'Sistema']));

    return blasts.map((b) => ({
        ...b,
        creatorName: b.createdById ? userMap.get(b.createdById) || 'Desconocido' : 'Sistema',
    }));
}

// ── Enviar un blast (procesado chunk-by-chunk) ────────────────────────────

export async function sendEmailBlast(blastId: string) {
    const companyId = await getCompanyId();

    const blast = await prisma.emailBlast.findFirst({
        where: { id: blastId, companyId },
        include: { recipients: { where: { status: 'PENDING' } } },
    });

    if (!blast) throw new Error('Blast no encontrado');
    if (blast.status === 'SENDING' || blast.status === 'QUEUED') throw new Error('Ya está procesándose');

    // Ahora simplemente lo marcamos como QUEUED y estipulamos la fecha de envío (si no la tiene, es AHORA)
    await prisma.emailBlast.update({
        where: { id: blastId },
        data: { 
            status: 'QUEUED',
            scheduledAt: blast.scheduledAt ?? new Date()
        },
    });

    return { queued: true, message: 'La campaña ha sido encolada para su envío.' };
}

// ── Reintentar envío a fallidos / pendientes ──────────────────────────────

export async function retryFailedEmailBlast(blastId: string) {
    const companyId = await getCompanyId();

    const blast = await prisma.emailBlast.findFirst({
        where: { id: blastId, companyId },
        include: { recipients: { where: { status: { in: ['FAILED', 'PENDING'] } } } },
    });

    if (!blast) throw new Error('Blast no encontrado');
    if (blast.recipients.length === 0) throw new Error('No hay contactos fallidos o pendientes para reenviar');

    // 1. Reseteamos los recipientes a PENDING
    await prisma.emailBlastRecipient.updateMany({
        where: { blastId, status: { in: ['FAILED', 'PENDING'] } },
        data: { status: 'PENDING', errorMessage: null }
    });

    // 2. Reactivamos la campaña para el cron
    await prisma.emailBlast.update({
        where: { id: blastId },
        data: { 
            status: 'QUEUED',
            scheduledAt: new Date() // Enviar lo antes posible
        },
    });

    return { queued: true, message: `Reencolados ${blast.recipients.length} contactos para reintento.` };
}

// ── Estadísticas de un blast ──────────────────────────────────────────────

export async function getEmailBlastStats(blastId: string) {
    const companyId = await getCompanyId();

    const blast = await prisma.emailBlast.findFirst({
        where: { id: blastId, companyId },
        include: {
            recipients: {
                select: { email: true, name: true, status: true, errorMessage: true, sentAt: true },
                orderBy: { status: 'asc' },
            },
        },
    });
    if (!blast) throw new Error('Blast no encontrado');
    return blast;
}

// ── Eliminar un blast ─────────────────────────────────────────────────────

export async function deleteEmailBlast(blastId: string) {
    const companyId = await getCompanyId();
    await prisma.emailBlast.delete({ where: { id: blastId, companyId } });
    return { success: true };
}

export async function deleteEmailBlasts(blastIds: string[]) {
    const companyId = await getCompanyId();
    await prisma.emailBlast.deleteMany({
        where: { id: { in: blastIds }, companyId },
    });
    return { success: true };
}

// ── Clonar un blast (crea un DRAFT con el mismo contenido) ────────────────

export async function cloneEmailBlast(blastId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('No autenticado');
    const companyId = await getCompanyId();

    const original = await prisma.emailBlast.findFirst({
        where: { id: blastId, companyId },
        include: {
            recipients: {
                select: { email: true, name: true, variables: true },
            },
        },
    });
    if (!original) throw new Error('Blast no encontrado');

    const clone = await prisma.emailBlast.create({
        data: {
            name: `${original.name} (Copia)`,
            subject: original.subject,
            htmlBody: original.htmlBody,
            fromName: original.fromName,
            fromEmail: original.fromEmail,
            status: 'DRAFT',
            totalRecipients: original.totalRecipients,
            companyId,
            createdById: session.user.id,
            recipients: {
                create: original.recipients.map((r) => ({
                    email: r.email,
                    name: r.name,
                    variables: r.variables ?? {},
                    status: 'PENDING',
                })),
            },
        },
    });

    return clone;
}

// ── Enviar email de prueba ────────────────────────────────────────────────

export async function sendTestEmail(subject: string, html: string, toEmail: string) {
    const result = await getResend().emails.send({
        from: 'LegacyMark <noreply@legacymarksas.com>',
        to: toEmail,
        subject: `[PRUEBA] ${subject}`,
        html,
    });
    return { success: !!result.data?.id, id: result.data?.id };
}
