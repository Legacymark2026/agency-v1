"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- Types & Schemas ---

const ExpertSchema = z.object({
    name: z.string().min(2, "Name is required"),
    role: z.string().min(2, "Role is required"),
    bio: z.string().optional(),
    imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
    socialLinks: z.string().optional(), // JSON string
    badgeId: z.string().optional(),
    iconName: z.string().optional(),
    skills: z.array(z.string()).default([]),
    isVisible: z.boolean().default(true),
    order: z.number().default(0),
});

export type ExpertInput = z.infer<typeof ExpertSchema>;

// --- Actions ---

export async function getExperts() {
    try {
        const experts = await db.expert.findMany({
            where: { isVisible: true },
            orderBy: { order: "asc" },
        });
        return experts;
    } catch (error) {
        console.error("Error fetching experts:", error);
        return [];
    }
}

export async function getAllExpertsAdmin() {
    try {
        const experts = await db.expert.findMany({
            orderBy: { order: "asc" },
        });
        return experts;
    } catch (error) {
        console.error("Error fetching all experts:", error);
        return [];
    }
}

export async function createExpert(data: ExpertInput) {
    try {
        const validated = ExpertSchema.parse(data);

        // Parse social links if present
        let socialLinksJson = {};
        if (validated.socialLinks) {
            try {
                socialLinksJson = JSON.parse(validated.socialLinks);
            } catch (e) {
                console.error("Invalid social links JSON", e);
            }
        }

        await db.expert.create({
            data: {
                name: validated.name,
                role: validated.role,
                bio: validated.bio,
                imageUrl: validated.imageUrl,
                socialLinks: socialLinksJson,
                badgeId: validated.badgeId,
                iconName: validated.iconName,
                skills: validated.skills,
                isVisible: validated.isVisible,
                order: validated.order,
            },
        });

        revalidatePath("/dashboard/experts");
        revalidatePath("/nosotros");
        return { success: true };
    } catch (error) {
        console.error("Error creating expert:", error);
        return { success: false, error: "Failed to create expert" };
    }
}

export async function updateExpert(id: string, data: Partial<ExpertInput>) {
    try {
        const validated = ExpertSchema.partial().parse(data);

        // Parse social links if present
        let socialLinksJson = undefined;
        if (validated.socialLinks) {
            try {
                socialLinksJson = JSON.parse(validated.socialLinks);
            } catch (e) {
                console.error("Invalid social links JSON", e);
            }
        }

        await db.expert.update({
            where: { id },
            data: {
                ...validated,
                socialLinks: socialLinksJson,
            },
        });

        revalidatePath("/dashboard/experts");
        revalidatePath("/nosotros");
        return { success: true };
    } catch (error) {
        console.error("Error updating expert:", error);
        return { success: false, error: "Failed to update expert" };
    }
}

export async function deleteExpert(id: string) {
    try {
        await db.expert.delete({
            where: { id },
        });

        revalidatePath("/dashboard/experts");
        revalidatePath("/nosotros");
        return { success: true };
    } catch (error) {
        console.error("Error deleting expert:", error);
        return { success: false, error: "Failed to delete expert" };
    }
}

export async function reorderExperts(items: { id: string; order: number }[]) {
    try {
        // Transactional update for performance and consistency
        await db.$transaction(
            items.map((item) =>
                db.expert.update({
                    where: { id: item.id },
                    data: { order: item.order },
                })
            )
        );

        revalidatePath("/dashboard/experts");
        revalidatePath("/nosotros");
        return { success: true };
    } catch (error) {
        console.error("Error reordering experts:", error);
        return { success: false, error: "Failed to reorder experts" };
    }
}
