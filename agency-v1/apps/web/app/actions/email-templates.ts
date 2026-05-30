"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function fetchEmailTemplates(companyId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];
    try {
        return await prisma.emailTemplate.findMany({
            where: { companyId },
            orderBy: { updatedAt: "desc" }
        });
    } catch {
        return [];
    }
}

export async function createEmailTemplate(data: {
    name: string; subject: string; body: string; description?: string;
    category: string; variables: string[]; companyId: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    try {
        const tpl = await prisma.emailTemplate.create({
            data: {
                name: data.name,
                subject: data.subject,
                body: data.body,
                description: data.description,
                category: data.category,
                variables: data.variables,
                companyId: data.companyId
            }
        });
        revalidatePath("/dashboard/settings/company");
        return { success: true, data: tpl };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteEmailTemplate(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    try {
        await prisma.emailTemplate.delete({ where: { id } });
        revalidatePath("/dashboard/settings/company");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
