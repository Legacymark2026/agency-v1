"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createLocalNotification } from "./notifications";

export type SocialPostPayload = {
    content: string;
    mediaUrls?: string[];
    platforms: string[];
    scheduledAt?: Date | null;
    status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
    // Eje 5: Gobernanza
    approvalStatus?: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
    internalNotes?: string;
    // Eje 1: Automatización
    isEvergreen?: boolean;
    timezone?: string;
    campaignId?: string;
    // Eje 3: Nativas
    targetUrl?: string;
    tiktokAudioId?: string;
    firstComment?: string;
    // Eje 4: Analítica
    utmCampaign?: string;
    utmSource?: string;
    utmMedium?: string;
};

/**
 * Obtiene todos los posts sociales de una compañía para armar el calendario.
 */
export async function getSocialPosts(companyId: string) {
    try {
        const posts = await prisma.socialPost.findMany({
            where: { companyId },
            include: {
                author: { select: { id: true, name: true, image: true, email: true } },
                approver: { select: { id: true, name: true, image: true } },
                _count: { select: { comments: true } }
            },
            orderBy: { scheduledAt: 'asc' }
        });
        return { success: true, data: posts };
    } catch (error) {
        console.error("Error fetching social posts:", error);
        return { success: false, error: "Error al obtener las publicaciones." };
    }
}

/**
 * Crea un nuevo post social.
 */
export async function createSocialPost(companyId: string, authorId: string, payload: SocialPostPayload) {
    try {
        const post = await prisma.socialPost.create({
            data: {
                companyId,
                authorId,
                content: payload.content,
                mediaUrls: payload.mediaUrls || [],
                platforms: payload.platforms,
                scheduledAt: payload.scheduledAt,
                status: payload.status,
                approvalStatus: payload.approvalStatus || "PENDING",
                internalNotes: payload.internalNotes,
                isEvergreen: payload.isEvergreen || false,
                timezone: payload.timezone,
                targetUrl: payload.targetUrl,
                tiktokAudioId: payload.tiktokAudioId,
                firstComment: payload.firstComment,
                utmCampaign: payload.utmCampaign,
                utmSource: payload.utmSource,
                utmMedium: payload.utmMedium,
            }
        });
        
        // Log Audit
        await prisma.socialPostLog.create({
            data: {
                postId: post.id,
                userId: authorId,
                action: "CREATED",
                details: { status: post.status, platforms: post.platforms }
            }
        });

        revalidatePath('/dashboard/marketing/calendar');
        return { success: true, data: post };
    } catch (error) {
        console.error("Error creating social post:", error);
        return { success: false, error: "Error al crear la publicación." };
    }
}

/**
 * Actualiza un post social.
 */
export async function updateSocialPost(postId: string, userId: string, payload: Partial<SocialPostPayload>) {
    try {
        const post = await prisma.socialPost.update({
            where: { id: postId },
            data: {
                content: payload.content,
                mediaUrls: payload.mediaUrls,
                platforms: payload.platforms,
                scheduledAt: payload.scheduledAt,
                status: payload.status,
                approvalStatus: payload.approvalStatus,
                internalNotes: payload.internalNotes,
                isEvergreen: payload.isEvergreen,
                timezone: payload.timezone,
                targetUrl: payload.targetUrl,
                tiktokAudioId: payload.tiktokAudioId,
                firstComment: payload.firstComment,
                utmCampaign: payload.utmCampaign,
                utmSource: payload.utmSource,
                utmMedium: payload.utmMedium,
                publishedAt: payload.status === "PUBLISHED" ? new Date() : undefined
            }
        });

        // Log Audit
        await prisma.socialPostLog.create({
            data: {
                postId: post.id,
                userId,
                action: "UPDATED",
                details: { status: post.status, scheduledAt: post.scheduledAt }
            }
        });

        revalidatePath('/dashboard/marketing/calendar');
        return { success: true, data: post };
    } catch (error) {
        console.error("Error updating social post:", error);
        return { success: false, error: "Error al actualizar la publicación." };
    }
}

/**
 * Elimina un post del calendario.
 */
export async function deleteSocialPost(postId: string, userId: string) {
    try {
        await prisma.socialPost.delete({ where: { id: postId } });
        // No log needed strictly as the post cascades logic, but could be logged globally.
        revalidatePath('/dashboard/marketing/calendar');
        return { success: true };
    } catch (error) {
        console.error("Error deleting social post:", error);
        return { success: false, error: "Error al eliminar la publicación." };
    }
}

// ── Gobernanza y Comentarios ────────────────────────────────

export async function approveSocialPost(postId: string, approverId: string, status: "APPROVED" | "REJECTED") {
    try {
        const post = await prisma.socialPost.update({
            where: { id: postId },
            data: {
                approvalStatus: status,
                approvedById: approverId
            }
        });

        await prisma.socialPostLog.create({
            data: {
                postId,
                userId: approverId,
                action: `APPROVAL_STATUS_CHANGED_${status}`,
            }
        });

        const postWithAuthor = await prisma.socialPost.findUnique({ where: { id: postId }, select: { authorId: true, content: true, companyId: true } });
        if (postWithAuthor) {
            await createLocalNotification({
                companyId: postWithAuthor.companyId,
                userId: postWithAuthor.authorId,
                type: `SOCIAL_POST_${status}`,
                title: status === "APPROVED" ? "Post Aprobado 🎉" : "Post Rechazado ❌",
                message: `El post ha sido ${status === "APPROVED" ? "aprobado" : "rechazado"} y está listo para ${status === "APPROVED" ? "su publicación" : "tu revisión"}.`,
            });
        }

        revalidatePath('/dashboard/marketing/calendar');
        return { success: true, data: post };
    } catch (error) {
         console.error("Error approving social post:", error);
         return { success: false, error: "Error al procesar la aprobación." };
    }
}

export async function getSocialPostComments(postId: string) {
    try {
        const comments = await prisma.socialPostComment.findMany({
            where: { postId },
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: 'asc' }
        });
        return { success: true, data: comments };
    } catch (error) {
        console.error("Error fetching comments:", error);
        return { success: false, error: "Error al obtener comentarios." };
    }
}

export async function createSocialPostComment(postId: string, userId: string, content: string) {
    try {
        const comment = await prisma.socialPostComment.create({
            data: { postId, userId, content }
        });
        
        await prisma.socialPostLog.create({
            data: {
                postId, userId, action: "COMMENT_ADDED"
            }
        });

        revalidatePath('/dashboard/marketing/calendar');
        return { success: true, data: comment };
    } catch (error) {
        console.error("Error creating comment:", error);
        return { success: false, error: "Error al guardar el comentario." };
    }
}
