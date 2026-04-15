"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    return session;
}

// ─── TIPOS ────────────────────────────────────────────────────────────────────
export interface SequenceStep {
    delayDays: number;
    type: "EMAIL" | "TASK" | "WHATSAPP";
    subject?: string;
    body: string;
    taskTitle?: string;
}

// ─── CRUD SECUENCIAS ──────────────────────────────────────────────────────────

export async function createEmailSequence(data: {
    companyId: string;
    name: string;
    description?: string;
    triggerStage?: string;
    steps: SequenceStep[];
}) {
    await getSession();
    const seq = await prisma.emailSequence.create({
        data: {
            companyId: data.companyId,
            name: data.name,
            description: data.description,
            triggerStage: data.triggerStage,
            steps: data.steps as any,
        },
    });
    revalidatePath("/dashboard/admin/crm/sequences");
    return { success: true, data: seq };
}

export async function updateEmailSequence(id: string, data: Partial<{
    name: string; description: string; triggerStage: string; isActive: boolean; steps: SequenceStep[];
}>) {
    await getSession();
    const seq = await prisma.emailSequence.update({ where: { id }, data: data as any });
    revalidatePath("/dashboard/admin/crm/sequences");
    return { success: true, data: seq };
}

export async function deleteEmailSequence(id: string) {
    await getSession();
    await prisma.emailSequence.delete({ where: { id } });
    revalidatePath("/dashboard/admin/crm/sequences");
    return { success: true };
}

export async function listEmailSequences(companyId: string) {
    return prisma.emailSequence.findMany({
        where: { companyId },
        include: { enrollments: { select: { id: true, status: true } } },
        orderBy: { createdAt: "desc" },
    });
}

// ─── ENROLLAR DEAL EN SECUENCIA ───────────────────────────────────────────────

export async function enrollDealInSequence(dealId: string, sequenceId: string) {
    await getSession();
    const sequence = await prisma.emailSequence.findUnique({ where: { id: sequenceId } });
    if (!sequence) return { success: false, error: "Secuencia no encontrada" };

    const steps = sequence.steps as unknown as SequenceStep[];
    if (!steps || steps.length === 0) return { success: false, error: "La secuencia no tiene pasos" };

    const firstRunAt = new Date();
    firstRunAt.setDate(firstRunAt.getDate() + (steps[0]?.delayDays ?? 0));

    const enrollment = await prisma.emailSequenceEnrollment.upsert({
        where: { sequenceId_dealId: { sequenceId, dealId } },
        update: { status: "ACTIVE", currentStep: 0, nextRunAt: firstRunAt, completedAt: null },
        create: { sequenceId, dealId, currentStep: 0, status: "ACTIVE", nextRunAt: firstRunAt },
    });

    revalidatePath("/dashboard/admin/crm");
    return { success: true, data: enrollment };
}

export async function pauseEnrollment(enrollmentId: string) {
    await getSession();
    await prisma.emailSequenceEnrollment.update({ where: { id: enrollmentId }, data: { status: "PAUSED" } });
    return { success: true };
}

export async function cancelEnrollment(enrollmentId: string) {
    await getSession();
    await prisma.emailSequenceEnrollment.update({ where: { id: enrollmentId }, data: { status: "CANCELLED" } });
    return { success: true };
}

// ─── PROCESADOR DE SECUENCIAS (Cron) ──────────────────────────────────────────

/**
 * Procesar el siguiente paso de todas las secuencias vencidas.
 * Llamado desde /api/crm/process-sequences cada hora.
 */
export async function processEmailSequences(companyId: string) {
    const now = new Date();

    const dueEnrollments = await prisma.emailSequenceEnrollment.findMany({
        where: {
            status: "ACTIVE",
            nextRunAt: { lte: now },
            sequence: { companyId, isActive: true },
        },
        include: {
            sequence: true,
            deal: {
                select: {
                    id: true, title: true, contactEmail: true, contactName: true,
                    assignedTo: true, value: true, stage: true,
                },
            },
        },
    });

    const results: { enrollmentId: string; dealId: string; stepIndex: number; result: string }[] = [];

    for (const enrollment of dueEnrollments) {
        const steps = enrollment.sequence.steps as unknown as SequenceStep[];
        const stepIndex = enrollment.currentStep;
        const step = steps[stepIndex];

        if (!step) {
            // No more steps — mark as completed
            await prisma.emailSequenceEnrollment.update({
                where: { id: enrollment.id },
                data: { status: "COMPLETED", completedAt: now },
            });
            results.push({ enrollmentId: enrollment.id, dealId: enrollment.dealId, stepIndex, result: "COMPLETED" });
            continue;
        }

        try {
            // Aquí iría la lógica real de envío de email (usando el configured email provider)
            // Por ahora registra la actividad en CRM + log
            if (step.type === "EMAIL" && enrollment.deal.assignedTo) {
                await prisma.cRMActivity.create({
                    data: {
                        dealId: enrollment.dealId,
                        userId: enrollment.deal.assignedTo,
                        type: "SEQUENCE_EMAIL",
                        content: `[Secuencia Auto] ${step.subject ?? "Email Automático"} → ${enrollment.deal.contactEmail ?? "contacto"}`,
                    },
                });
            }

            // Avanzar al siguiente paso
            const nextStepIndex = stepIndex + 1;
            const nextStep = steps[nextStepIndex];
            let nextRunAt: Date | null = null;

            if (nextStep) {
                nextRunAt = new Date();
                nextRunAt.setDate(nextRunAt.getDate() + nextStep.delayDays);
            }

            await prisma.emailSequenceEnrollment.update({
                where: { id: enrollment.id },
                data: {
                    currentStep: nextStepIndex,
                    nextRunAt,
                    status: nextStep ? "ACTIVE" : "COMPLETED",
                    completedAt: nextStep ? null : now,
                },
            });

            results.push({ enrollmentId: enrollment.id, dealId: enrollment.dealId, stepIndex, result: "SENT" });
        } catch (e) {
            results.push({ enrollmentId: enrollment.id, dealId: enrollment.dealId, stepIndex, result: `ERROR: ${String(e)}` });
        }
    }

    return { processed: dueEnrollments.length, results };
}

export async function getEnrollmentsByDeal(dealId: string) {
    return prisma.emailSequenceEnrollment.findMany({
        where: { dealId },
        include: { sequence: { select: { id: true, name: true, steps: true } } },
        orderBy: { createdAt: "desc" },
    });
}
