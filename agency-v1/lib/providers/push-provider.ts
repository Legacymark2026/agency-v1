import { prisma } from "@/lib/prisma";
import webpush from "web-push";

// Ensure you configure these in your .env:
// NEXT_PUBLIC_VAPID_PUBLIC_KEY
// VAPID_PRIVATE_KEY
// VAPID_SUBJECT

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@legacymarksas.com";

if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);
} else {
    console.warn("[Push Provider] VAPID keys are missing. Web Push notifications will fail if invoked.");
}

export async function sendWebPush(userId: string, title: string, message: string, link?: string) {
    try {
        if (!publicVapidKey || !privateVapidKey) {
            throw new Error("VAPID Keys not configured on server.");
        }

        const userProfile = await prisma.userProfile.findUnique({
            where: { userId }
        });

        if (!userProfile || !userProfile.preferences) {
            throw new Error("User has no profile or preferences to extract push subscriptions.");
        }

        const prefs = userProfile.preferences as any;
        const subscriptions: webpush.PushSubscription[] = prefs.pushSubscriptions || [];

        if (subscriptions.length === 0) {
            throw new Error("User has no active Web Push Subscriptions registered.");
        }

        const payload = JSON.stringify({
            title,
            body: message,
            url: link || "/",
            icon: "/icon.png", // Ensure you have this in public folder
            badge: "/badge.png" // Ensure you have this in public folder
        });

        let successCount = 0;
        let expiredSubscriptions: webpush.PushSubscription[] = [];

        // Dispatch to all user devices
        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(sub, payload);
                successCount++;
            } catch (error: any) {
                if (error.statusCode === 404 || error.statusCode === 410) {
                    // Subscription has expired or is no longer valid
                    expiredSubscriptions.push(sub);
                } else {
                    console.error("[Web Push Error]", error);
                }
            }
        }

        // Clean up expired subscriptions from JSON
        if (expiredSubscriptions.length > 0) {
            const validSubs = subscriptions.filter(s => !expiredSubscriptions.includes(s));
            prefs.pushSubscriptions = validSubs;
            
            await prisma.userProfile.update({
                where: { userId },
                data: { preferences: prefs }
            });
        }

        if (successCount === 0) {
            throw new Error("All push delivery attempts failed or were expired.");
        }

        return { success: true, devicesReached: successCount };

    } catch (error: any) {
        console.error("[Push Provider] Dispatch Error:", error);
        throw error; // Let the engine catch and log it
    }
}
