'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsSchema, type SettingsFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { safeTableQuery } from "@/lib/db-utils";
import bcrypt from "bcryptjs";
import { generateSecret, generateQRCode, generateBackupCodes, verifyToken } from "@/lib/mfa";

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

            // Appearance Preferences
            accent: preferences.accent || "teal",
            density: preferences.density || "normal",
            font: preferences.font || "inter",
            bgTheme: preferences.bgTheme || "slate",
            borderRadius: preferences.borderRadius || "sharp",
            glassmorphism: preferences.glassmorphism !== false,
            highContrast: Boolean(preferences.highContrast),
            soundEffects: preferences.soundEffects !== false,
            sidebarCollapsed: Boolean(preferences.sidebarCollapsed),
            animationsEnabled: preferences.animationsEnabled !== false,

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

            // Appearance Defaults
            accent: "teal",
            density: "normal",
            font: "inter",
            bgTheme: "slate",
            borderRadius: "sharp",
            glassmorphism: true,
            highContrast: false,
            soundEffects: true,
            sidebarCollapsed: false,
            animationsEnabled: true,

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
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) return [];

    try {
        const activeSessions = await prisma.session.findMany({
            where: { userId: userAuth.id },
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
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) throw new Error("Unauthorized");

    try {
        await prisma.session.delete({
            where: { id: sessionId, userId: userAuth.id }
        });

        try {
            await (prisma as any).userActivityLog.create({
                data: {
                    userId: userAuth.id,
                    action: "SESSION_REVOKED",
                    metadata: { sessionId, timestamp: new Date().toISOString() }
                }
            });
        } catch { }

        revalidatePath("/dashboard/settings/security");
        return { success: true };
    } catch (error) {
        console.error("Failed to revoke session:", error);
        return { success: false, error: "Failed to revoke session" };
    }
}

export async function revokeAllOtherSessions(currentSessionToken?: string) {
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) throw new Error("Unauthorized");

    try {
        if (currentSessionToken) {
            await prisma.session.deleteMany({
                where: {
                    userId: userAuth.id,
                    sessionToken: { not: currentSessionToken }
                }
            });
        } else {
            // If token not provided, preserve the most recently created session and delete others
            const sessions = await prisma.session.findMany({
                where: { userId: userAuth.id },
                orderBy: { expires: "desc" }
            });
            if (sessions.length > 1) {
                const keepId = sessions[0].id;
                await prisma.session.deleteMany({
                    where: {
                        userId: userAuth.id,
                        id: { not: keepId }
                    }
                });
            }
        }

        try {
            await (prisma as any).userActivityLog.create({
                data: {
                    userId: userAuth.id,
                    action: "ALL_OTHER_SESSIONS_REVOKED",
                    metadata: { timestamp: new Date().toISOString() }
                }
            });
        } catch { }

        revalidatePath("/dashboard/settings/security");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to revoke all other sessions:", error);
        return { success: false, error: error.message || "Failed to revoke sessions" };
    }
}

export async function getMyLoginHistory() {
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) return [];

    try {
        const logs = await prisma.userActivityLog.findMany({
            where: {
                userId: userAuth.id,
                action: {
                    in: [
                        "LOGIN_SUCCESS", "LOGIN_FAILED", "LOGIN_ERROR", 
                        "ADMIN_FORCED_PASSWORD_RESET", "MFA_ENABLED", 
                        "MFA_DISABLED", "PASSWORD_CHANGED", "SESSION_REVOKED", 
                        "ALL_OTHER_SESSIONS_REVOKED", "EMERGENCY_LOCKDOWN"
                    ]
                }
            },
            orderBy: { createdAt: "desc" },
            take: 30
        });

        return logs.map(log => ({
            id: log.id,
            date: log.createdAt,
            action: log.action,
            ip: log.ipAddress || "127.0.0.1",
            userAgent: log.userAgent || "Navegador Web / Dispositivo Seguro",
            status: (log.action.includes("FAILED") || log.action.includes("ERROR")) ? "failed" : "success",
        }));
    } catch (error) {
        console.error("Failed to fetch login history:", error);
        return [];
    }
}

export async function getPersonalSecurityOverview() {
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userAuth.id },
            select: {
                id: true,
                email: true,
                mfaEnabled: true,
                mfaSecret: true,
                backupCodes: true,
                passwordHash: true,
                emailVerified: true,
                createdAt: true,
            }
        });

        if (!user) return null;

        const hasPassword = Boolean(user.passwordHash);
        const mfaEnabled = Boolean(user.mfaEnabled && user.mfaSecret);
        const emailVerified = Boolean(user.emailVerified);

        let backupCodesList: string[] = [];
        if (user.backupCodes) {
            try {
                backupCodesList = Array.isArray(user.backupCodes)
                    ? (user.backupCodes as string[])
                    : JSON.parse(user.backupCodes as any);
            } catch { }
        }

        const unspentCodes = backupCodesList.filter(c => c && c !== "USED");
        const hasBackupCodes = unspentCodes.length > 0;

        // Count active sessions
        let activeSessionsCount = 1;
        try {
            activeSessionsCount = await prisma.session.count({
                where: { userId: user.id }
            });
        } catch { }

        // Count recent failed attempts (last 7 days)
        let recentFailedAttemptsCount = 0;
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            recentFailedAttemptsCount = await prisma.userActivityLog.count({
                where: {
                    userId: user.id,
                    action: { in: ["LOGIN_FAILED", "LOGIN_FAILED_BAD_PASSWORD"] },
                    createdAt: { gte: sevenDaysAgo }
                }
            });
        } catch { }

        // Calculate Security Health Score (0 - 100)
        let score = 0;
        if (hasPassword) score += 20;
        if (emailVerified) score += 15;
        if (mfaEnabled) score += 35;
        if (hasBackupCodes) score += 15;
        if (recentFailedAttemptsCount === 0) score += 15;

        let securityGrade: "A+" | "A" | "B" | "C" | "D" = "C";
        if (score >= 95) securityGrade = "A+";
        else if (score >= 80) securityGrade = "A";
        else if (score >= 65) securityGrade = "B";
        else if (score >= 50) securityGrade = "C";
        else securityGrade = "D";

        const checklist: Array<{
            id: string;
            title: string;
            description: string;
            status: "passed" | "warning" | "alert" | "neutral";
            impact: string;
        }> = [
            {
                id: "mfa",
                title: "Doble Factor de Autenticación (2FA)",
                description: mfaEnabled 
                    ? "Activo mediante aplicación TOTP (Google Authenticator / 1Password)" 
                    : "Tu cuenta está vulnerable sin 2FA. Actívalo para evitar accesos no autorizados.",
                status: mfaEnabled ? "passed" : "warning",
                impact: "+35 pts",
            },
            {
                id: "backup_codes",
                title: "Códigos de Respaldo de Emergencia",
                description: hasBackupCodes 
                    ? `Dispones de ${unspentCodes.length} códigos de recuperación sin usar.` 
                    : "Genera códigos de respaldo para no perder acceso a tu cuenta si cambias de móvil.",
                status: hasBackupCodes ? "passed" : "warning",
                impact: "+15 pts",
            },
            {
                id: "password",
                title: "Contraseña de Acceso",
                description: hasPassword 
                    ? "Contraseña protegida con cifrado criptográfico bcrypt (cost factor 12)." 
                    : "Cuenta autenticada vía proveedor federado (OAuth).",
                status: "passed",
                impact: "+20 pts",
            },
            {
                id: "email",
                title: "Verificación de Correo Electrónico",
                description: emailVerified 
                    ? "Dirección de correo electrónico validada y verificada." 
                    : "Correo pendiente de verificación.",
                status: emailVerified ? "passed" : "neutral",
                impact: "+15 pts",
            },
            {
                id: "suspicious",
                title: "Monitoreo de Amenazas & Actividad Sospechosa",
                description: recentFailedAttemptsCount === 0 
                    ? "Sin intentos fallidos ni anomalías detectadas en los últimos 7 días." 
                    : `Se detectaron ${recentFailedAttemptsCount} intentos fallidos recientemente.`,
                status: recentFailedAttemptsCount === 0 ? "passed" : "alert",
                impact: "+15 pts",
            },
        ];

        return {
            id: user.id,
            email: user.email || "",
            hasPassword,
            mfaEnabled,
            hasBackupCodes,
            unspentCodesCount: unspentCodes.length,
            emailVerified,
            activeSessionsCount,
            recentFailedAttemptsCount,
            securityScore: score,
            securityGrade,
            checklist,
            createdAt: user.createdAt.toISOString(),
        };
    } catch (error) {
        console.error("Failed to get personal security overview:", error);
        return null;
    }
}

export async function initiateTotpSetup() {
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) throw new Error("Unauthorized");

    try {
        const userEmail = userAuth.email || "user@legacymarksas.com";
        const { secret, otpauthUrl } = generateSecret(userEmail);
        const qrCode = await generateQRCode(otpauthUrl);

        return {
            success: true,
            secret,
            qrCode,
            otpauthUrl
        };
    } catch (error: any) {
        console.error("Failed to initiate TOTP setup:", error);
        return { success: false, error: error.message || "Failed to generate TOTP secret" };
    }
}

export async function confirmAndEnableTotp(code: string, secret: string) {
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) throw new Error("Unauthorized");

    try {
        if (!code || code.length !== 6) {
            return { success: false, error: "El código debe contener 6 dígitos." };
        }

        const isValid = verifyToken(code, secret);
        if (!isValid) {
            return { success: false, error: "Código incorrecto o expirado. Asegúrate de que el reloj de tu dispositivo esté sincronizado." };
        }

        // Generate 10 secure backup codes
        const backupCodes = generateBackupCodes(10);

        await prisma.user.update({
            where: { id: userAuth.id },
            data: {
                mfaEnabled: true,
                mfaSecret: secret,
                backupCodes: backupCodes
            }
        });

        try {
            await (prisma as any).userActivityLog.create({
                data: {
                    userId: userAuth.id,
                    action: "MFA_ENABLED",
                    metadata: { timestamp: new Date().toISOString() }
                }
            });
        } catch { }

        revalidatePath("/dashboard/settings/security");
        revalidatePath("/dashboard/settings");
        return { success: true, backupCodes };
    } catch (error: any) {
        console.error("Failed to confirm TOTP:", error);
        return { success: false, error: error.message || "Failed to activate 2FA" };
    }
}

export async function disableTotp(password?: string) {
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) throw new Error("Unauthorized");

    try {
        const user = await prisma.user.findUnique({
            where: { id: userAuth.id },
            select: { passwordHash: true }
        });

        if (user?.passwordHash) {
            if (!password) {
                return { success: false, error: "Debes ingresar tu contraseña para desactivar 2FA." };
            }
            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                return { success: false, error: "Contraseña incorrecta." };
            }
        }

        await prisma.user.update({
            where: { id: userAuth.id },
            data: {
                mfaEnabled: false,
                mfaSecret: null,
                backupCodes: null
            }
        });

        try {
            await (prisma as any).userActivityLog.create({
                data: {
                    userId: userAuth.id,
                    action: "MFA_DISABLED",
                    metadata: { timestamp: new Date().toISOString() }
                }
            });
        } catch { }

        revalidatePath("/dashboard/settings/security");
        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to disable 2FA:", error);
        return { success: false, error: error.message || "Failed to disable 2FA" };
    }
}

export async function generateFreshBackupCodes(password?: string) {
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) throw new Error("Unauthorized");

    try {
        const user = await prisma.user.findUnique({
            where: { id: userAuth.id },
            select: { passwordHash: true, mfaEnabled: true }
        });

        if (!user?.mfaEnabled) {
            return { success: false, error: "Debes tener 2FA activado para generar códigos de respaldo." };
        }

        if (user.passwordHash && password) {
            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                return { success: false, error: "Contraseña incorrecta." };
            }
        }

        const codes = generateBackupCodes(10);

        await prisma.user.update({
            where: { id: userAuth.id },
            data: { backupCodes: codes }
        });

        try {
            await (prisma as any).userActivityLog.create({
                data: {
                    userId: userAuth.id,
                    action: "BACKUP_CODES_REGENERATED",
                    metadata: { timestamp: new Date().toISOString() }
                }
            });
        } catch { }

        revalidatePath("/dashboard/settings/security");
        return { success: true, backupCodes: codes };
    } catch (error: any) {
        console.error("Failed to generate backup codes:", error);
        return { success: false, error: error.message || "Failed to generate backup codes" };
    }
}

export async function emergencyLockdown() {
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) throw new Error("Unauthorized");

    try {
        // Delete all sessions for user
        await prisma.session.deleteMany({
            where: { userId: userAuth.id }
        });

        try {
            await (prisma as any).userActivityLog.create({
                data: {
                    userId: userAuth.id,
                    action: "EMERGENCY_LOCKDOWN",
                    metadata: { timestamp: new Date().toISOString() }
                }
            });
        } catch { }

        revalidatePath("/dashboard/settings/security");
        return { success: true };
    } catch (error: any) {
        console.error("Emergency lockdown failed:", error);
        return { success: false, error: error.message || "Emergency lockdown failed" };
    }
}

export async function exportSecurityAuditLog() {
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) throw new Error("Unauthorized");

    try {
        const logs = await prisma.userActivityLog.findMany({
            where: { userId: userAuth.id },
            orderBy: { createdAt: "desc" },
            take: 200
        });

        return {
            success: true,
            data: logs.map((l: any) => ({
                id: l.id,
                date: l.createdAt.toISOString(),
                action: l.action,
                ip: l.ipAddress || "127.0.0.1",
                userAgent: l.userAgent || "Unknown Device",
                metadata: l.metadata
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateUserAppearance(appearance: {
    theme?: "light" | "dark" | "system";
    accent?: string;
    density?: string;
    font?: string;
    bgTheme?: string;
    borderRadius?: "sharp" | "rounded" | "pill";
    glassmorphism?: boolean;
    highContrast?: boolean;
    soundEffects?: boolean;
    sidebarCollapsed?: boolean;
    animationsEnabled?: boolean;
}) {
    const userAuth = await resolveCurrentUserId();
    if (!userAuth) return { success: false, error: "Unauthorized" };

    try {
        const userId = userAuth.id;

        // Fetch existing profile/preferences
        const profile = await prisma.userProfile.findUnique({
            where: { userId }
        });

        let preferences: any = {};
        if (profile?.preferences) {
            try {
                preferences = typeof profile.preferences === 'string'
                    ? JSON.parse(profile.preferences)
                    : profile.preferences;
            } catch { }
        }

        // Merge new appearance settings
        const updatedPreferences = {
            ...preferences,
            ...appearance
        };

        await prisma.userProfile.upsert({
            where: { userId },
            create: {
                userId,
                preferences: updatedPreferences,
                socialLinks: {},
                jobTitle: "",
                bio: ""
            },
            update: {
                preferences: updatedPreferences
            }
        });

        // Fail-safe audit log
        try {
            await (prisma as any).userActivityLog.create({
                data: {
                    userId,
                    action: "APPEARANCE_UPDATED",
                    metadata: {
                        timestamp: new Date().toISOString(),
                        appearance
                    }
                }
            });
        } catch { }

        revalidatePath('/dashboard/settings/appearance');
        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update user appearance:", error);
        return { success: false, error: error.message || "Failed to update" };
    }
}

