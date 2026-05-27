"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

export async function getInboxMacros(companyId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/inbox/macros?companyId=${companyId}`);
        const resData = await response.json();

        if (!response.ok) {
            return { success: false, error: resData.error || "Failed to fetch inbox macros" };
        }

        return { success: true, data: resData.data };
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

        const response = await fetch(`${GATEWAY_URL}/api/inbox/macros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const resData = await response.json();

        if (!response.ok) {
            return { success: false, error: resData.error || "Failed to create macro" };
        }

        revalidatePath('/dashboard/settings/inbox/macros');
        revalidatePath('/dashboard/inbox');
        return { success: true, data: resData.data };
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

        const response = await fetch(`${GATEWAY_URL}/api/inbox/macros/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const resData = await response.json();

        if (!response.ok) {
            return { success: false, error: resData.error || "Failed to update macro" };
        }

        revalidatePath('/dashboard/settings/inbox/macros');
        revalidatePath('/dashboard/inbox');
        return { success: true, data: resData.data };
    } catch (error: any) {
        console.error("Error updating inbox macro:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteInboxMacro(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/inbox/macros/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            return { success: false, error: "Failed to delete macro" };
        }

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

        const response = await fetch(`${GATEWAY_URL}/api/inbox/macros/${id}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive })
        });
        const resData = await response.json();

        if (!response.ok) {
            return { success: false, error: resData.error || "Failed to toggle macro" };
        }

        revalidatePath('/dashboard/settings/inbox/macros');
        revalidatePath('/dashboard/inbox');
        return { success: true, data: resData.data };
    } catch (error: any) {
        console.error("Error toggling inbox macro:", error);
        return { success: false, error: error.message };
    }
}
