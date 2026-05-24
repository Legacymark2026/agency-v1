"use server";

import { prisma } from "@/lib/prisma";
import { safeTableQuery } from "@/lib/db-utils";
import { revalidatePath } from "next/cache";

export type SocialProfileData = {
    platform: "instagram" | "tiktok" | "facebook";
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    website?: string;
    followersCount?: number;
    followingCount?: number;
    emoji?: string;
};

/** Get all 3 platform profiles */
export async function getSocialProfiles() {
    return safeTableQuery("tbl_social_profiles", async () =>
        prisma.socialProfile.findMany({
            orderBy: { platform: "asc" },
        }),
        []
    );
}

/** Get a single platform profile (public - no auth) */
export async function getSocialProfile(platform: string) {
    return safeTableQuery("tbl_social_profiles", async () =>
        prisma.socialProfile.findUnique({ where: { platform } }),
        null
    );
}

/** Upsert a profile from the dashboard */
export async function upsertSocialProfile(data: SocialProfileData) {
    try {
        await prisma.socialProfile.upsert({
            where: { platform: data.platform },
            create: {
                platform: data.platform,
                username: data.username,
                displayName: data.displayName,
                avatarUrl: data.avatarUrl || null,
                bio: data.bio || null,
                website: data.website || null,
                followersCount: data.followersCount ?? 0,
                followingCount: data.followingCount ?? 0,
                emoji: data.emoji || "😎",
            },
            update: {
                username: data.username,
                displayName: data.displayName,
                avatarUrl: data.avatarUrl || null,
                bio: data.bio || null,
                website: data.website || null,
                followersCount: data.followersCount ?? 0,
                followingCount: data.followingCount ?? 0,
                emoji: data.emoji || "😎",
            },
        });

        revalidatePath("/portfolio");
        revalidatePath("/es/portfolio");
        revalidatePath("/en/portfolio");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
