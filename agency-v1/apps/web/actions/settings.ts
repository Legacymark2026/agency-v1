'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsSchema, type SettingsFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { safeTableQuery } from "@/lib/db-utils";

// Helper to safely get the current authenticated user ID, supporting both id and email lookups
async function resolveCurrentUserId(): Promise<{ id: string; email?: string | null; name?: string | null; image?: string | null } | null> {
    const session = await auth();
    if (!session?.user) return null;

    if (session.user.id) {
        return {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
        };
    }

    if (session.user.email) {
        try {
            const dbUser = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true, email: true, name: true, image: true }
            });
            if (dbUser) {
                return dbUser;
            }
        } catch (e) {
            console.warn("[resolveCurrentUserId] Error querying user by email:", e);
        }
    }

    return null;
}

export async function getSettings() {
    const session = await auth();
    if (!session?.user) return null;

    const sessionUserId = session.user.id;
    const sessionUserEmail = session.user.email;
    const sessionUserName = session.user.name || "";
    const sessionUserImage = session.user.image || "";

    try {
        let user: any = null;

        // 1. Fetch user entity safely with profile only (no risky joined relations)
        if (sessionUserId) {
            user = await prisma.user.findUnique({
                where: { id: sessionUserId },
                include: { profile: true }
            });
        }

        if (!user && sessionUserEmail) {
            user = await prisma.user.findUnique({
                where: { email: sessionUserEmail },
                include: { profile: true }
            });
        }

        const resolvedId = user?.id || sessionUserId || "";
        const email = user?.email || sessionUserEmail || "";
        const role = user?.role || (session.user as any).role || "member";
        const globalRole = user?.globalRole || "client_user";
        const emailVerified = Boolean(user?.emailVerified);
        const mfaEnabled = Boolean(user?.mfaEnabled);
        const createdAt = user?.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString();

        // 2. Fetch company membership independently (isolated try-catch)
        let companyName = "Organización Principal";
        if (resolvedId) {
            try {
                const membership = await prisma.companyUser.findFirst({
                    where: { userId: resolvedId },
                    include: { company: true }
                });
                if (membership?.company?.name) {
                    companyName = membership.company.name;
                }
            } catch (e) {
                console.warn("[getSettings] Non-critical: could not fetch company:", e);
            }
        }

        // 3. Fetch connected OAuth accounts independently (isolated try-catch)
        let connectedProviders: string[] = [];
        if (resolvedId) {
            try {
                const accounts = await prisma.account.findMany({
                    where: { userId: resolvedId },
                    select: { provider: true }
                });
                if (Array.isArray(accounts)) {
                    connectedProviders = accounts.map(a => a.provider);
                }
            } catch (e) {
                console.warn("[getSettings] Non-critical: could not fetch accounts:", e);
            }
        }

        const profile = user?.profile;

        // 4. Parse preferences
        let preferences: any = {
            theme: "system",
            language: "es",
            notifications: { email: true },
            timezone: "America/Bogota",
            currency: "USD",
            dateFormat: "DD/MM/YYYY",
            timeFormat: "12h"
        };
        if (profile?.preferences) {
            try {
                const prefs = typeof profile.preferences === 'string'
                    ? JSON.parse(profile.preferences)
                    : profile.preferences;
                if (prefs && typeof prefs === 'object') {
                    preferences = { ...preferences, ...prefs };
                }
            } catch { }
        }

        // 5. Parse social links
        let socialLinks = {
            linkedin: "",
            github: "",
            twitter: "",
            website: "",
            calendarUrl: ""
        };
        if (profile?.socialLinks) {
            try {
                const links = typeof profile.socialLinks === 'string'
                    ? JSON.parse(profile.socialLinks)
                    : profile.socialLinks;
                if (links && typeof links === 'object') {
                    socialLinks = { ...socialLinks, ...links };
                }
            } catch { }
        }

        // 6. Parse metadata
        let metadata: any = {
            coverImage: null,
            country: "Colombia",
            city: "Bogotá",
            status: "ONLINE",
            statusMessage: "",
            pronouns: "",
            skills: []
        };
        if (profile?.metadata) {
            try {
                const meta = typeof profile.metadata === 'string'
                    ? JSON.parse(profile.metadata)
                    : profile.metadata;
                if (meta && typeof meta === 'object') {
                    metadata = { ...metadata, ...meta };
                }
            } catch { }
        }

        // 7. Extract names safely
        const rawName = (user?.name || sessionUserName || "").trim();
        const nameParts = rawName ? rawName.split(/\s+/) : [];
        const firstName = user?.firstName || nameParts[0] || "";
        const lastName = user?.lastName || nameParts.slice(1).join(" ") || "";

        // 8. Calculate Profile Completeness Percentage
        let completionScore = 0;
        if (firstName && lastName) completionScore += 20;
        if (user?.image || sessionUserImage) completionScore += 15;
        if (user?.phone) completionScore += 10;
        if (profile?.jobTitle || user?.jobTitle) completionScore += 15;
        if (profile?.department) completionScore += 10;
        if (profile?.bio) completionScore += 10;
        if (socialLinks.linkedin || socialLinks.github || socialLinks.twitter || socialLinks.website) completionScore += 10;
        if (mfaEnabled) completionScore += 10;
        const profileCompletedPercentage = Math.min(100, completionScore);

        return {
            id: resolvedId,
            email,
            emailVerified,
            role,
            globalRole,
            mfaEnabled,
            createdAt,
            companyName,
            connectedProviders,

            firstName,
            lastName,
            phone: user?.phone || "",
            image: user?.image || sessionUserImage,
            jobTitle: profile?.jobTitle || user?.jobTitle || "",
            department: profile?.department || "",
            bio: profile?.bio || "",
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
        console.error("Failed to fetch settings, using resilient fallback:", error);
        const rawName = (sessionUserName || "").trim();
        const nameParts = rawName ? rawName.split(/\s+/) : [];
        return {
            id: sessionUserId || "",
            email: sessionUserEmail || "",
            emailVerified: false,
            role: (session.user as any).role || "member",
            globalRole: "client_user",
            mfaEnabled: false,
            createdAt: new Date().toISOString(),
            companyName: "Organización Principal",
            connectedProviders: [],
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            phone: "",
            image: sessionUserImage,
            jobTitle: "",
            department: "",
            bio: "",
            pronouns: "",
            country: "Colombia",
            city: "Bogotá",
            status: "ONLINE" as const,
            statusMessage: "",
            skills: [],
            coverImage: null,
            linkedin: "",
            github: "",
            twitter: "",
            website: "",
            calendarUrl: "",
            theme: "system" as const,
            language: "es" as const,
            timezone: "America/Bogota",
            currency: "USD",
            dateFormat: "DD/MM/YYYY" as const,
            timeFormat: "12h" as const,
            emailNotifications: true,
            profileCompletedPercentage: 25,
        };
    }
}

export async function updateSettings(data: SettingsFormData) {
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) throw new Error("Unauthorized");

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
        const userId = userAuth.id;

        // 1. Update User base entity
        await prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                phone,
                ...(image !== undefined ? { image } : {})
            }
        });

        // 2. Fetch existing profile metadata and preferences for deep merge
        let existingProfile: any = null;
        try {
            existingProfile = await prisma.userProfile.findUnique({
                where: { userId }
            });
        } catch { }

        let existingPrefs: any = {};
        if (existingProfile?.preferences) {
            try {
                existingPrefs = typeof existingProfile.preferences === 'string'
                    ? JSON.parse(existingProfile.preferences)
                    : existingProfile.preferences;
            } catch { }
        }

        let existingMeta: any = {};
        if (existingProfile?.metadata) {
            try {
                existingMeta = typeof existingProfile.metadata === 'string'
                    ? JSON.parse(existingProfile.metadata)
                    : existingProfile.metadata;
            } catch { }
        }

        const mergedPreferences = {
            ...existingPrefs,
            theme,
            language,
            notifications: {
                ...(existingPrefs?.notifications || {}),
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
            where: { userId },
            create: {
                userId,
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

        // 4. Record Audit / Activity Log (fail-safe)
        try {
            await (prisma as any).userActivityLog.create({
                data: {
                    userId,
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
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) throw new Error("Unauthorized");

    try {
        await prisma.user.update({
            where: { id: userAuth.id },
            data: { image: null }
        });
        revalidatePath("/dashboard/settings/profile");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function exportAccountData() {
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) throw new Error("Unauthorized");

    try {
        const userId = userAuth.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
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
            organizations: (user.companies || []).map(c => ({
                companyId: c.companyId,
                companyName: c.company?.name || "Organización",
                role: c.roleName || "member",
                joinedAt: c.joinedAt
            })),
            connectedAccounts: (user.accounts || []).map(a => ({
                provider: a.provider,
                type: a.type
            })),
            recentActivity: user.activityLogs || []
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

