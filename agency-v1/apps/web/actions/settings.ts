'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsSchema, type SettingsFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { safeTableQuery } from "@/lib/db-utils";

export async function getSettings() {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                profile: true,
                companies: {
                    include: { company: true }
                },
                accounts: {
                    select: { provider: true }
                }
            }
        });

        if (!user) return null;

        // Parse preferences from JSON, ensuring type safety
        let preferences: any = {
            theme: "system",
            language: "es",
            notifications: { email: true },
            timezone: "America/Bogota",
            currency: "USD",
            dateFormat: "DD/MM/YYYY",
            timeFormat: "12h"
        };
        if (user.profile?.preferences) {
            try {
                const prefs = typeof user.profile.preferences === 'string'
                    ? JSON.parse(user.profile.preferences)
                    : user.profile.preferences;

                if (prefs) {
                    preferences = { ...preferences, ...prefs };
                }
            } catch { }
        }

        // Parse social links
        let socialLinks = {
            linkedin: "",
            github: "",
            twitter: "",
            website: "",
            calendarUrl: ""
        };
        if (user.profile?.socialLinks) {
            try {
                const links = typeof user.profile.socialLinks === 'string'
                    ? JSON.parse(user.profile.socialLinks)
                    : user.profile.socialLinks;
                if (links) {
                    socialLinks = { ...socialLinks, ...links };
                }
            } catch { }
        }

        // Parse metadata
        let metadata: any = {
            coverImage: null,
            country: "Colombia",
            city: "Bogotá",
            status: "ONLINE",
            statusMessage: "",
            pronouns: "",
            skills: []
        };
        if (user.profile?.metadata) {
            try {
                const meta = typeof user.profile.metadata === 'string'
                    ? JSON.parse(user.profile.metadata)
                    : user.profile.metadata;
                if (meta) {
                    metadata = { ...metadata, ...meta };
                }
            } catch { }
        }

        // Calculate Profile Completeness Percentage
        let completionScore = 0;
        if (user.firstName && user.lastName) completionScore += 20;
        if (user.image) completionScore += 15;
        if (user.phone) completionScore += 10;
        if (user.profile?.jobTitle || user.jobTitle) completionScore += 15;
        if (user.profile?.department) completionScore += 10;
        if (user.profile?.bio) completionScore += 10;
        if (socialLinks.linkedin || socialLinks.github || socialLinks.twitter || socialLinks.website) completionScore += 10;
        if (user.mfaEnabled) completionScore += 10;
        const profileCompletedPercentage = Math.min(100, completionScore);

        return {
            id: user.id,
            email: user.email || "",
            emailVerified: Boolean(user.emailVerified),
            role: user.role || "member",
            globalRole: user.globalRole || "client_user",
            mfaEnabled: Boolean(user.mfaEnabled),
            createdAt: user.createdAt.toISOString(),
            companyName: user.companies?.[0]?.company?.name || "Organización Principal",
            connectedProviders: user.accounts.map(a => a.provider),

            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phone: user.phone || "",
            image: user.image || "",
            jobTitle: user.profile?.jobTitle || user.jobTitle || "",
            department: user.profile?.department || "",
            bio: user.profile?.bio || "",
            pronouns: metadata.pronouns || "",
            country: metadata.country || "Colombia",
            city: metadata.city || "Bogotá",
            status: (["ONLINE", "AWAY", "BUSY", "OFFLINE"].includes(metadata.status) ? metadata.status : "ONLINE") as "ONLINE" | "AWAY" | "BUSY" | "OFFLINE",
            statusMessage: metadata.statusMessage || "",
            skills: Array.isArray(metadata.skills) ? metadata.skills : [],
            coverImage: metadata.coverImage || null,

            linkedin: socialLinks.linkedin || "",
            github: socialLinks.github || "",
            twitter: socialLinks.twitter || "",
            website: socialLinks.website || "",
            calendarUrl: socialLinks.calendarUrl || "",

            theme: (["light", "dark", "system"].includes(preferences.theme) ? preferences.theme : "system") as "light" | "dark" | "system",
            language: (["es", "en", "pt", "fr"].includes(preferences.language) ? preferences.language : "es") as "es" | "en" | "pt" | "fr",
            timezone: preferences.timezone || "America/Bogota",
            currency: preferences.currency || "USD",
            dateFormat: (preferences.dateFormat || "DD/MM/YYYY") as "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD",
            timeFormat: (preferences.timeFormat || "12h") as "12h" | "24h",
            emailNotifications: preferences.notifications?.email ?? true,

            profileCompletedPercentage,
        };
    } catch (error) {
        console.error("Failed to fetch settings:", error);
        return null;
    }
}

export async function updateSettings(data: SettingsFormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const validated = SettingsSchema.safeParse(data);
    if (!validated.success) {
        return { success: false, error: "Datos inválidos: " + validated.error.errors.map(e => e.message).join(", ") };
    }

    const {
        firstName, lastName, phone,
        jobTitle, department, bio, pronouns,
        country, city, status, statusMessage, skills,
        linkedin, github, twitter, website, calendarUrl,
        image, coverImage,
        theme, language, emailNotifications, timezone, currency,
        dateFormat, timeFormat
    } = validated.data;

    try {
        // 1. Update User base entity
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                firstName,
                lastName,
                phone,
                ...(image !== undefined ? { image } : {})
            }
        });

        // 2. Fetch existing profile metadata and preferences for deep merge
        const existingProfile = await prisma.userProfile.findUnique({
            where: { userId: session.user.id }
        });

        let existingPrefs: any = {};
        if (existingProfile?.preferences) {
            existingPrefs = typeof existingProfile.preferences === 'string'
                ? JSON.parse(existingProfile.preferences)
                : existingProfile.preferences;
        }

        let existingMeta: any = {};
        if (existingProfile?.metadata) {
            existingMeta = typeof existingProfile.metadata === 'string'
                ? JSON.parse(existingProfile.metadata)
                : existingProfile.metadata;
        }

        const mergedPreferences = {
            ...existingPrefs,
            theme,
            language,
            notifications: {
                ...(existingPrefs.notifications || {}),
                email: emailNotifications
            },
            timezone,
            currency,
            dateFormat,
            timeFormat
        };

        const mergedMetadata = {
            ...existingMeta,
            coverImage,
            country,
            city,
            status,
            statusMessage,
            pronouns,
            skills: skills || []
        };

        const mergedSocialLinks = {
            linkedin,
            github,
            twitter,
            website,
            calendarUrl
        };

        // 3. Upsert User Profile
        await prisma.userProfile.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                jobTitle,
                department,
                bio,
                socialLinks: mergedSocialLinks,
                preferences: mergedPreferences,
                metadata: mergedMetadata
            },
            update: {
                jobTitle,
                department,
                bio,
                socialLinks: mergedSocialLinks,
                preferences: mergedPreferences,
                metadata: mergedMetadata
            }
        });

        // 4. Record Audit / Activity Log
        try {
            await (prisma as any).userActivityLog.create({
                data: {
                    userId: session.user.id,
                    action: "PROFILE_UPDATED",
                    metadata: {
                        timestamp: new Date().toISOString(),
                        updatedFields: ["profile", "preferences", "presence"]
                    }
                }
            });
        } catch { }

        revalidatePath("/dashboard/settings/profile");
        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update settings:", error);
        return { success: false, error: error.message || "Failed to update settings" };
    }
}

export async function deleteAvatar() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: null }
        });
        revalidatePath("/dashboard/settings/profile");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function exportAccountData() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                profile: true,
                companies: { include: { company: true } },
                accounts: true,
                sessions: true,
                activityLogs: { take: 50, orderBy: { createdAt: "desc" } }
            }
        });

        if (!user) throw new Error("Usuario no encontrado");

        const exportData = {
            exportMetadata: {
                platform: "LegacyMark SAS",
                compliance: "GDPR / Habeas Data (Ley 1581 de 2012)",
                exportedAt: new Date().toISOString(),
                exportId: crypto.randomUUID(),
            },
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                role: user.role,
                globalRole: user.globalRole,
                mfaEnabled: user.mfaEnabled,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            profile: user.profile,
            organizations: user.companies.map(c => ({
                companyId: c.companyId,
                companyName: c.company.name,
                role: c.role,
                joinedAt: c.createdAt
            })),
            connectedAccounts: user.accounts.map(a => ({
                provider: a.provider,
                type: a.type
            })),
            recentActivity: user.activityLogs
        };

        return { success: true, data: exportData };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateIntegrations(data: { gaPropertyId?: string; gaClientEmail?: string; gaPrivateKey?: string; fbPixelId?: string; gtmId?: string; hotjarId?: string }) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        await prisma.userProfile.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                googleAnalytics: {
                    propertyId: data.gaPropertyId,
                    clientEmail: data.gaClientEmail,
                    privateKey: data.gaPrivateKey
                },
                facebookPixel: {
                    pixelId: data.fbPixelId
                },
                googleTagManager: {
                    containerId: data.gtmId
                },
                hotjar: {
                    siteId: data.hotjarId
                }
            },
            update: {
                googleAnalytics: {
                    propertyId: data.gaPropertyId,
                    clientEmail: data.gaClientEmail,
                    privateKey: data.gaPrivateKey
                },
                facebookPixel: {
                    pixelId: data.fbPixelId
                },
                googleTagManager: {
                    containerId: data.gtmId
                },
                hotjar: {
                    siteId: data.hotjarId
                }
            }
        });

        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to update integrations:", error);
        return { success: false, error: "Failed to update integrations" };
    }
}

export async function getPublicIntegrations() {
    try {
        // console.log("[Settings] Initializing Public Integrations Retrieval...");

        // 1. Fetch from IntegrationConfig (New standard)
        const allConfigs = await safeTableQuery("tbl_integration_configs", async () =>
            prisma.integrationConfig.findMany({ where: { isEnabled: true } }),
            []
        );

        // 2. Fetch from UserProfile (Legacy/Fallback)
        const profile = await safeTableQuery("tbl_user_profiles", async () =>
            prisma.userProfile.findFirst({
                where: {
                    OR: [
                        { facebookPixel: { not: null as any } },
                        { googleTagManager: { not: null as any } },
                        { hotjar: { not: null as any } },
                        { googleAnalytics: { not: null as any } }
                    ]
                }
            }),
            null
        );

        let fbPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "";
        let gtmId = process.env.NEXT_PUBLIC_GTM_ID || "";
        let hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID || "";
        let ahrefsDataKey = process.env.NEXT_PUBLIC_AHREFS_DATA_KEY || "";
        let gaPropertyId = process.env.NEXT_PUBLIC_GA_PROPERTY_ID || "";
        // measurementId (G-XXXXXXXX) is what gtag.js needs — different from propertyId
        let gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
        let tiktokPixelId = "";
        let linkedinPartnerId = "";
        let googleAdsId = "";

        // Merge Strategy: IntegrationConfig > UserProfile > Env Vars

        // Process UserProfile (Legacy)
        if (profile) {
            if (profile.facebookPixel) {
                try {
                    const p = typeof profile.facebookPixel === 'string' ? JSON.parse(profile.facebookPixel) : profile.facebookPixel;
                    if (p?.pixelId) fbPixelId = p.pixelId;
                } catch { }
            }
            if (profile.googleTagManager) {
                try {
                    const p = typeof profile.googleTagManager === 'string' ? JSON.parse(profile.googleTagManager) : profile.googleTagManager;
                    if (p?.containerId) gtmId = p.containerId;
                } catch { }
            }
            if (profile.hotjar) {
                try {
                    const p = typeof profile.hotjar === 'string' ? JSON.parse(profile.hotjar) : profile.hotjar;
                    if (p?.siteId) hotjarId = p.siteId;
                } catch { }
            }
            if (profile.googleAnalytics) {
                try {
                    const p = typeof profile.googleAnalytics === 'string' ? JSON.parse(profile.googleAnalytics) : profile.googleAnalytics;
                    if (p?.propertyId) gaPropertyId = p.propertyId;
                    if (p?.measurementId) gaMeasurementId = p.measurementId;
                } catch { }
            }
        }

        // Process IntegrationConfig (Priority)
        allConfigs.forEach(conf => {
            const data = conf.config as any;
            if (conf.provider === 'facebook-pixel' && data?.pixelId) fbPixelId = data.pixelId;
            if (conf.provider === 'google-tag-manager' && data?.containerId) gtmId = data.containerId;
            if (conf.provider === 'hotjar' && data?.siteId) hotjarId = data.siteId;
            if (conf.provider === 'ahrefs' && data?.dataKey) ahrefsDataKey = data.dataKey;
            if (conf.provider === 'google-analytics') {
                if (data?.propertyId) gaPropertyId = data.propertyId;
                if (data?.measurementId) gaMeasurementId = data.measurementId;
            }
            if (conf.provider === 'tiktok-pixel' && data?.tiktokPixelId) tiktokPixelId = data.tiktokPixelId;
            if (conf.provider === 'linkedin-insight' && data?.linkedinPartnerId) linkedinPartnerId = data.linkedinPartnerId;
            if (conf.provider === 'google-ads' && data?.googleAdsId) googleAdsId = data.googleAdsId;

            // Special Case: Facebook provider might also have Pixel ID
            if (conf.provider === 'facebook' && data?.pixelId) fbPixelId = data.pixelId;
        });

        // gaPropertyId used as fallback for gaMeasurementId if it looks like a Measurement ID
        if (!gaMeasurementId && gaPropertyId && gaPropertyId.startsWith('G-')) {
            gaMeasurementId = gaPropertyId;
        }

        const results = { fbPixelId, gtmId, hotjarId, ahrefsDataKey, gaPropertyId: gaMeasurementId, tiktokPixelId, linkedinPartnerId, googleAdsId };

        if (Object.values(results).some(v => !!v)) {
            // console.log("[Settings] Public Integrations Found:", JSON.stringify(results));
        } else {
            // console.log("[Settings] No active public integrations found.");
        }

        return results;
    } catch (error) {
        console.error("[Settings] Error fetching public integrations:", error);
        return { fbPixelId: "", gtmId: "", hotjarId: "", ahrefsDataKey: "", gaPropertyId: "", tiktokPixelId: "", linkedinPartnerId: "", googleAdsId: "" };
    }
}


export async function getActiveSessions() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const activeSessions = await prisma.session.findMany({
            where: { userId: session.user.id },
            orderBy: { expires: "desc" }
        });

        return activeSessions.map(s => ({
            id: s.id,
            sessionToken: s.sessionToken,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent,
            expires: s.expires.toISOString(),
        }));
    } catch (error) {
        console.error("Failed to fetch active sessions:", error);
        return [];
    }
}

export async function revokeSession(sessionId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        await prisma.session.delete({
            where: { id: sessionId, userId: session.user.id }
        });
        revalidatePath("/dashboard/settings/security");
        return { success: true };
    } catch (error) {
        console.error("Failed to revoke session:", error);
        return { success: false, error: "Failed to revoke session" };
    }
}

export async function getMyLoginHistory() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const logs = await prisma.userActivityLog.findMany({
            where: {
                userId: session.user.id,
                action: {
                    in: ["LOGIN_SUCCESS", "LOGIN_FAILED", "LOGIN_ERROR", "ADMIN_FORCED_PASSWORD_RESET"]
                }
            },
            orderBy: { createdAt: "desc" },
            take: 10
        });

        return logs.map(log => ({
            id: log.id,
            date: log.createdAt,
            action: log.action,
            ip: log.ipAddress || "Desconocida",
            userAgent: log.userAgent || "Dispositivo Desconocido",
            status: log.action.includes("SUCCESS") ? "success" : "failed",
        }));
    } catch (error) {
        console.error("Failed to fetch login history:", error);
        return [];
    }
}

export async function updateUserAppearance(appearance: {
    theme?: "light" | "dark" | "system";
    accent?: string;
    density?: string;
    font?: string;
    bgTheme?: string;
    sidebarCollapsed?: boolean;
    animationsEnabled?: boolean;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        // Fetch existing profile/preferences
        const profile = await prisma.userProfile.findUnique({
            where: { userId: session.user.id }
        });

        let preferences: any = {};
        if (profile?.preferences) {
            preferences = typeof profile.preferences === 'string'
                ? JSON.parse(profile.preferences)
                : profile.preferences;
        }

        // Merge new appearance settings
        const updatedPreferences = {
            ...preferences,
            ...appearance
        };

        await prisma.userProfile.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                preferences: updatedPreferences,
                socialLinks: {},
                jobTitle: "",
                bio: ""
            },
            update: {
                preferences: updatedPreferences
            }
        });

        revalidatePath('/dashboard/settings/appearance');
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update user appearance:", error);
        return { success: false, error: error.message || "Failed to update" };
    }
}

