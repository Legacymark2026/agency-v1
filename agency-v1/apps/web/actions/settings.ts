'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsSchema, type SettingsFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function getSettings() {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { profile: true }
        });

        if (!user) return null;

        // Parse preferences from JSON, ensuring type safety
        let preferences: any = { theme: "system", language: "es", notifications: { email: true }, timezone: "America/Bogota", currency: "USD" };
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
        let socialLinks = { linkedin: "", github: "" };
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

        // Parse GA config
        let gaConfig: { propertyId?: string; clientEmail?: string; privateKey?: string } = {};
        if (user.profile && 'googleAnalytics' in user.profile) {
            try {
                // @ts-ignore: Prisma JSON types can be tricky if client not regenerated
                const ga = user.profile.googleAnalytics;
                const parsedGa = typeof ga === 'string' ? JSON.parse(ga) : ga;
                if (parsedGa) {
                    gaConfig = { ...gaConfig, ...parsedGa };
                }
            } catch { }
        }

        return {
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phone: user.phone || "",
            image: user.image || "",
            jobTitle: user.profile?.jobTitle || "",
            bio: user.profile?.bio || "",
            linkedin: socialLinks.linkedin || "",
            github: socialLinks.github || "",
            theme: (["light", "dark", "system"].includes(preferences.theme) ? preferences.theme : "system") as "light" | "dark" | "system",
            language: (["es", "en", "pt"].includes(preferences.language) ? preferences.language : "es") as "es" | "en" | "pt",
            emailNotifications: preferences.notifications?.email ?? true,
            timezone: preferences.timezone || "America/Bogota",
            currency: preferences.currency || "USD",
            gaPropertyId: gaConfig.propertyId || "",
            gaClientEmail: gaConfig.clientEmail || "",
            gaPrivateKey: gaConfig.privateKey || "",
            fbPixelId: (() => {
                if (user.profile && 'facebookPixel' in user.profile) {
                    try {
                        // @ts-ignore
                        const fb = user.profile.facebookPixel;
                        const p = typeof fb === 'string' ? JSON.parse(fb) : fb;
                        return p?.pixelId || "";
                    } catch { }
                }
                return "";
            })(),
            gtmId: (() => {
                if (user.profile && 'googleTagManager' in user.profile) {
                    try {
                        // @ts-ignore
                        const gtm = user.profile.googleTagManager;
                        const p = typeof gtm === 'string' ? JSON.parse(gtm) : gtm;
                        return p?.containerId || "";
                    } catch { }
                }
                return "";
            })(),
            hotjarId: (() => {
                if (user.profile && 'hotjar' in user.profile) {
                    try {
                        // @ts-ignore
                        const hj = user.profile.hotjar;
                        const p = typeof hj === 'string' ? JSON.parse(hj) : hj;
                        return p?.siteId || "";
                    } catch { }
                }
                return "";
            })(),
            coverImage: (() => {
                if (user.profile?.metadata) {
                    try {
                        const meta = typeof user.profile.metadata === 'string' ? JSON.parse(user.profile.metadata) : user.profile.metadata;
                        return meta?.coverImage || null;
                    } catch { }
                }
                return null;
            })(),
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
        return { success: false, error: "Invalid data" };
    }

    const {
        firstName, lastName, phone,
        jobTitle, bio,
        linkedin, github, image, coverImage,
        theme, language, emailNotifications, timezone, currency
    } = validated.data;

    try {
        // Update User basic info
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                firstName,
                lastName,
                phone,
                ...(image !== undefined ? { image } : {})
            }
        });

        // Upsert User Profile
        await prisma.userProfile.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                jobTitle,
                bio,
                socialLinks: { linkedin, github },
                preferences: { theme, language, notifications: { email: emailNotifications }, timezone, currency },
                metadata: { coverImage }
            },
            update: {
                jobTitle,
                bio,
                socialLinks: { linkedin, github },
                preferences: { theme, language, notifications: { email: emailNotifications }, timezone, currency },
                metadata: { coverImage }
            }
        });

        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to update settings:", error);
        return { success: false, error: "Failed to update settings" };
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
        let allConfigs: any[] = [];
        try {
            allConfigs = await prisma.integrationConfig.findMany({
                where: { isEnabled: true }
            });
            // console.log(`[Settings] Found ${allConfigs.length} enabled integration configs`);
        } catch (dbErr) {
            console.error("[Settings] CRITICAL: Failed to query integrationConfig table:", dbErr);
            // Continue with empty configs — don't abort the whole function
        }

        // 2. Fetch from UserProfile (Legacy/Fallback)
        const profile = await prisma.userProfile.findFirst({
            where: {
                OR: [
                    { facebookPixel: { not: null as any } },
                    { googleTagManager: { not: null as any } },
                    { hotjar: { not: null as any } },
                    { googleAnalytics: { not: null as any } }
                ]
            }
        });

        let fbPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "";
        let gtmId = process.env.NEXT_PUBLIC_GTM_ID || "";
        let hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID || "";
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

        const results = { fbPixelId, gtmId, hotjarId, gaPropertyId: gaMeasurementId, tiktokPixelId, linkedinPartnerId, googleAdsId };

        if (Object.values(results).some(v => !!v)) {
            // console.log("[Settings] Public Integrations Found:", JSON.stringify(results));
        } else {
            // console.log("[Settings] No active public integrations found.");
        }

        return results;
    } catch (error) {
        console.error("[Settings] Error fetching public integrations:", error);
        return { fbPixelId: "", gtmId: "", hotjarId: "", gaPropertyId: "", tiktokPixelId: "", linkedinPartnerId: "", googleAdsId: "" };
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

