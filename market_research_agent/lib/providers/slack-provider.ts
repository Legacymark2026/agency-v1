import { prisma } from "@/lib/prisma";

export async function sendSlackWebhook(companyId: string, title: string, message: string, link?: string) {
    try {
        const config = await prisma.integrationConfig.findFirst({
            where: {
                companyId,
                provider: "slack",
                isEnabled: true
            }
        });

        if (!config || !config.config) {
            throw new Error("Slack Integration is not configured or enabled for this company.");
        }

        const jsonObj = config.config as any;
        const webhookUrl = jsonObj.webhookUrl;

        if (!webhookUrl) {
            throw new Error("Slack webhook URL is missing in the configuration.");
        }

        // Build a professional Block Kit message
        const blocks = [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: title,
                    emoji: true
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: message
                }
            }
        ];

        if (link) {
            blocks.push({
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "View Details",
                            emoji: true
                        },
                        url: link.startsWith("http") ? link : `https://legacymarksas.com${link}`,
                        action_id: "button-action"
                    }
                ]
            });
        }

        const payload = {
            text: title, // Fallback
            blocks
        };

        const res = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Slack API replied with status ${res.status}: ${errorText}`);
        }

        return { success: true, timestamp: new Date().toISOString() };
    } catch (error: any) {
        console.error("[Slack Provider] Dispatch Error:", error);
        throw error;
    }
}
