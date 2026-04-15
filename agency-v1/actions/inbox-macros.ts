'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

export type InboxMacroActionType = 'TEXT_REPLY' | 'ASSIGN_TAG' | 'ESCALATE' | 'SEND_PAYMENT_LINK' | 'WEBHOOK';

export interface InboxMacroPayload {
    textTemplate?: string;
    tagsToAdd?: string[];
    assignToId?: string;
    escalateToTeamId?: string;
    webhookUrl?: string;
    paymentLinkUrl?: string;
    [key: string]: any;
}

export async function getInboxMacros(companyId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const macros = await db.inboxMacro.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, data: macros };
    } catch (error: any) {
        console.error("Error fetching inbox macros:", error);
        return { success: false, error: error.message };
    }
}

export async function createInboxMacro(data: {
    companyId: string;
    title: string;
    description?: string;
    icon?: string;
    color?: string;
    actionType: InboxMacroActionType;
    payload: InboxMacroPayload;
    isActive?: boolean;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const macro = await db.inboxMacro.create({
            data: {
                companyId: data.companyId,
                title: data.title,
                description: data.description,
                icon: data.icon || 'Wand2',
                color: data.color || '#10b981',
                actionType: data.actionType,
                payload: data.payload as Prisma.InputJsonValue,
                isActive: data.isActive ?? true
            }
        });

        revalidatePath('/dashboard/settings/inbox/macros');
        revalidatePath('/dashboard/inbox');
        return { success: true, data: macro };
    } catch (error: any) {
        console.error("Error creating inbox macro:", error);
        return { success: false, error: error.message };
    }
}

export async function updateInboxMacro(id: string, data: Partial<{
    title: string;
    description: string;
    icon: string;
    color: string;
    actionType: InboxMacroActionType;
    payload: InboxMacroPayload;
    isActive: boolean;
}>) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const macro = await db.inboxMacro.update({
            where: { id },
            data: {
                ...data,
                payload: data.payload as Prisma.InputJsonValue | undefined
            }
        });

        revalidatePath('/dashboard/settings/inbox/macros');
        revalidatePath('/dashboard/inbox');
        return { success: true, data: macro };
    } catch (error: any) {
        console.error("Error updating inbox macro:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteInboxMacro(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        await db.inboxMacro.delete({
            where: { id }
        });

        revalidatePath('/dashboard/settings/inbox/macros');
        revalidatePath('/dashboard/inbox');
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting inbox macro:", error);
        return { success: false, error: error.message };
    }
}

export async function toggleInboxMacro(id: string, isActive: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const macro = await db.inboxMacro.update({
            where: { id },
            data: { isActive }
        });

        revalidatePath('/dashboard/settings/inbox/macros');
        revalidatePath('/dashboard/inbox');
        return { success: true, data: macro };
    } catch (error: any) {
        console.error("Error toggling inbox macro:", error);
        return { success: false, error: error.message };
    }
}
