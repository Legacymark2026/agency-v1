import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getNotificationHtml } from "@/lib/email-templates";

interface NotificationPayload {
    companyId: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
    // Specify target channels to bypass preferences (e.g. forced alerts)
    forceChannels?: ("IN_APP" | "EMAIL" | "WHATSAPP" | "PUSH" | "SLACK")[];
}

/**
 * Enterprise Notification Engine
 * Dispatches alerts asynchronously avoiding blocking the main request thread.
 */
export async function dispatchNotification(payload: NotificationPayload) {
    const { companyId, userId, type, title, message, link, metadata, forceChannels } = payload;

    try {
        // 1. Always create the In-App Notification (The Bell Icon)
        const notificationRecord = await prisma.notification.create({
            data: {
                companyId,
                userId,
                type,
                title,
                message,
                link,
                metadata,
                isRead: false,
            }
        });

        // Execute external channels (Await ensures Vercel/NextJS doesn't kill the background process)
        await processExternalChannels(notificationRecord.id, payload).catch(err => {
            console.error("[Notification Engine] Failed to process external channels:", err);
        });

        return { success: true, notificationId: notificationRecord.id };
    } catch (error) {
        console.error("[Notification Engine] Fatal dispatch error:", error);
        return { success: false, error };
    }
}

async function processExternalChannels(notificationId: string, payload: NotificationPayload) {
    const { companyId, userId, type, title, message, link, forceChannels } = payload;

    // 2. Resolve target channels
    let targetChannels: string[] = forceChannels || [];

    if (!forceChannels) {
        // Look up user preferences for this specific event type
        const prefs = await prisma.notificationPreference.findMany({
            where: {
                userId,
                companyId,
                event: type,
                enabled: true
            }
        });
        targetChannels = prefs.map(p => p.channel);
    }

    if (targetChannels.length === 0) {
        return; // User has deactivated all external alerts for this event
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    // 3. Dispatch to all enabled channels concurrently 
    const promises = targetChannels.map(async (channel) => {
        let status = "SENT";
        let errorMessage: string | null = null;
        let providerInfo: any = {};

        try {
            switch (channel) {
                case "EMAIL":
                    if (user.email) {
                        const html = getNotificationHtml({ title, message, link });
                        const result = await sendEmail({
                            to: user.email,
                            subject: title,
                            html,
                            companyId
                        });
                        providerInfo = { resendId: result };
                    } else {
                        throw new Error("User has no email");
                    }
                    break;

                case "WHATSAPP":
                    // TODO: Connect via meta-service
                    providerInfo = { notes: "WhatsApp dispatcher requires specific Template ID." };
                    break;

                case "PUSH":
                    const { sendWebPush } = await import("./providers/push-provider");
                    providerInfo = await sendWebPush(userId, title, message, link);
                    break;
                
                case "SLACK":
                    const { sendSlackWebhook } = await import("./providers/slack-provider");
                    providerInfo = await sendSlackWebhook(companyId, title, message, link);
                    break;

                default:
                    throw new Error(`Unsupported channel: ${channel}`);
            }

        } catch (err: any) {
            status = "FAILED";
            errorMessage = err.message || "Unknown delivery error";
            console.error(`[Notification Engine] Failed to send to ${channel}:`, err);
        }

        // 4. Log delivery attempt
        await prisma.notificationDeliveryLog.create({
            data: {
                notificationId,
                companyId,
                userId,
                channel,
                status,
                errorMessage,
                providerInfo
            }
        });
    });

    await Promise.allSettled(promises);
}
