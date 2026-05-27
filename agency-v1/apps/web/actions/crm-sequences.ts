"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { EmailSequence, EmailSequenceEnrollment } from "@prisma/client";

export interface EmailSequenceWithEnrollments extends EmailSequence {
    enrollments: EmailSequenceEnrollment[];
}

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

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
    content?: string; // alias for body — both accepted
    taskTitle?: string;
    message?: string; // for WHATSAPP steps
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
    const res = await fetch(`${GATEWAY_URL}/api/crm/sequences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to create email sequence");
    revalidatePath("/dashboard/admin/crm/sequences");
    return resData;
}

export async function updateEmailSequence(id: string, data: Partial<{
    name: string; description: string; triggerStage: string; isActive: boolean; steps: SequenceStep[];
}>) {
    await getSession();
    const res = await fetch(`${GATEWAY_URL}/api/crm/sequences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to update email sequence");
    revalidatePath("/dashboard/admin/crm/sequences");
    return resData;
}

export async function deleteEmailSequence(id: string) {
    await getSession();
    const res = await fetch(`${GATEWAY_URL}/api/crm/sequences/${id}`, {
        method: "DELETE",
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to delete email sequence");
    revalidatePath("/dashboard/admin/crm/sequences");
    return { success: true };
}

export async function listEmailSequences(companyId: string): Promise<EmailSequenceWithEnrollments[]> {
    const res = await fetch(`${GATEWAY_URL}/api/crm/sequences?companyId=${companyId}`);
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to list email sequences");
    return resData.data as EmailSequenceWithEnrollments[];
}

// ─── ENROLLAR DEAL EN SECUENCIA ───────────────────────────────────────────────

export async function enrollDealInSequence(dealId: string, sequenceId: string) {
    await getSession();
    const res = await fetch(`${GATEWAY_URL}/api/crm/sequences/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, sequenceId }),
    });
    const resData = await res.json();
    if (!res.ok) return { success: false, error: resData.error || "Failed to enroll deal in sequence" };
    revalidatePath("/dashboard/admin/crm");
    return { success: true, data: resData.data };
}

export async function pauseEnrollment(enrollmentId: string) {
    await getSession();
    const res = await fetch(`${GATEWAY_URL}/api/crm/sequences/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAUSED" }),
    });
    if (!res.ok) throw new Error("Failed to pause enrollment");
    return { success: true };
}

export async function cancelEnrollment(enrollmentId: string) {
    await getSession();
    const res = await fetch(`${GATEWAY_URL}/api/crm/sequences/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (!res.ok) throw new Error("Failed to cancel enrollment");
    return { success: true };
}

// ─── PROCESADOR DE SECUENCIAS (Cron) ──────────────────────────────────────────

/**
 * Procesar el siguiente paso de todas las secuencias vencidas.
 * Llamado desde /api/crm/process-sequences cada hora.
 */
export async function processEmailSequences(companyId: string) {
    const now = new Date();

    // Fetch due enrollments from Gateway
    const dueRes = await fetch(`${GATEWAY_URL}/api/crm/sequences/due-enrollments?companyId=${companyId}`);
    const dueData = await dueRes.json();
    if (!dueRes.ok) throw new Error(dueData.error || "Failed to fetch due enrollments");
    const dueEnrollments = dueData.data || [];

    const results: { enrollmentId: string; dealId: string; stepIndex: number; result: string }[] = [];

    for (const enrollment of dueEnrollments) {
        const steps = enrollment.sequence.steps as unknown as SequenceStep[];
        const stepIndex = enrollment.currentStep;
        const step = steps[stepIndex];

        if (!step) {
            // No more steps — mark as completed
            await fetch(`${GATEWAY_URL}/api/crm/sequences/enrollments/${enrollment.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "COMPLETED", completedAt: now }),
            });
            results.push({ enrollmentId: enrollment.id, dealId: enrollment.dealId, stepIndex, result: "COMPLETED" });
            continue;
        }

        try {
            if (step.type === "EMAIL") {
                const to = enrollment.deal.contactEmail;

                if (to) {
                    // Build email HTML from step configuration
                    const subject = step.subject || "Seguimiento automático";
                    const bodyTemplate = step.body || step.content || `<p>Hola ${enrollment.deal.contactName || ""},</p><p>${step.subject || "Te contactamos de LegacyMark."}</p>`;

                    // Render Handlebars variables
                    let html = bodyTemplate;
                    let renderedSubject = subject;
                    try {
                        const Handlebars = (await import("handlebars")).default;
                        const ctx = {
                            name: enrollment.deal.contactName || "",
                            email: to,
                            deal_title: enrollment.deal.title || "",
                            deal_value: enrollment.deal.value?.toString() || "",
                            stage: enrollment.deal.stage || "",
                        };
                        html = Handlebars.compile(bodyTemplate)(ctx);
                        renderedSubject = Handlebars.compile(subject)(ctx);
                    } catch { /* use raw on template error */ }

                    // Send via lib/email (handles per-company Resend key)
                    const { sendEmail } = await import("@/lib/email");
                    const sendResult = await sendEmail({
                        to,
                        subject: renderedSubject,
                        html,
                        companyId: enrollment.sequence.companyId,
                    });

                    if (!sendResult.success) {
                        throw new Error(`Email send failed: ${JSON.stringify(sendResult.error)}`);
                    }
                }

                // Audit trail — log the activity regardless via Gateway
                const assignedTo = enrollment.deal.assignedTo || enrollment.deal.assignedToUserId;
                if (assignedTo) {
                    await fetch(`${GATEWAY_URL}/api/deals/${enrollment.dealId}/activities`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: "SEQUENCE_EMAIL",
                            content: `[Secuencia] "${step.subject ?? "Email Automático"}" enviado a ${to ?? "contacto"}`,
                            userId: assignedTo,
                        }),
                    });
                }
            }

            // Avanzar al siguiente paso
            const nextStepIndex = stepIndex + 1;
            const nextStep = steps[nextStepIndex];
            let nextRunAt: Date | null = null;

            if (nextStep) {
                nextRunAt = new Date();
                nextRunAt.setDate(nextRunAt.getDate() + nextStep.delayDays);
            }

            await fetch(`${GATEWAY_URL}/api/crm/sequences/enrollments/${enrollment.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentStep: nextStepIndex,
                    nextRunAt,
                    status: nextStep ? "ACTIVE" : "COMPLETED",
                    completedAt: nextStep ? null : now,
                }),
            });

            results.push({ enrollmentId: enrollment.id, dealId: enrollment.dealId, stepIndex, result: "SENT" });
        } catch (e) {
            results.push({ enrollmentId: enrollment.id, dealId: enrollment.dealId, stepIndex, result: `ERROR: ${String(e)}` });
        }
    }

    return { processed: dueEnrollments.length, results };
}

export async function getEnrollmentsByDeal(dealId: string) {
    const res = await fetch(`${GATEWAY_URL}/api/crm/sequences?dealId=${dealId}`);
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to get enrollments by deal");
    return resData.data;
}
