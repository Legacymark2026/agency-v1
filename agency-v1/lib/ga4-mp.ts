import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

export interface Ga4EventData {
    eventName: string;
    clientId?: string; // Optional browser client_id. If missing, we'll generate one
    userId?: string;   // Optional logged in user id
    eventParams?: Record<string, any>;
    userData?: {
        // Will be hashed for Enhanced Conversions
        email?: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
    };
}

function hashSha256(str: string): string {
    return crypto.createHash('sha256').update(str.toLowerCase().trim()).digest('hex');
}

export async function sendGa4Event(companyId: string, event: Ga4EventData) {
    try {
        const configRecord = await prisma.integrationConfig.findUnique({
            where: {
                companyId_provider: {
                    companyId: companyId,
                    provider: 'google-analytics'
                }
            }
        });

        if (!configRecord || !configRecord.isEnabled) return null;

        const data = configRecord.config as any;
        const measurementId = data?.measurementId;
        const apiSecret = data?.apiSecret;

        if (!measurementId || !apiSecret) {
            console.warn(`[GA4-MP] Missing Measurement ID or API Secret for company ${companyId}`);
            return null;
        }

        // Format User Data for Enhanced Conversions (must be SHA-256 hashed)
        const userDataPayload: any = {};

        if (event.userData?.email) userDataPayload.sha256_email_address = hashSha256(event.userData.email);
        if (event.userData?.phone) {
            const cleanedPhone = event.userData.phone.replace(/[^0-9]/g, '');
            if (cleanedPhone) userDataPayload.sha256_phone_number = hashSha256(cleanedPhone);
        }

        if (event.userData?.firstName || event.userData?.lastName) {
            userDataPayload.address = {};
            if (event.userData.firstName) userDataPayload.address.sha256_first_name = hashSha256(event.userData.firstName);
            if (event.userData.lastName) userDataPayload.address.sha256_last_name = hashSha256(event.userData.lastName);
        }

        const payload: any = {
            client_id: event.clientId || uuidv4(), // Client ID is strictly required by GA4 MP
            events: [{
                name: event.eventName,
                params: {
                    currency: "COP",
                    value: 0.00,
                    engagement_time_msec: 1, // Required for standard reporting to see events
                    ...event.eventParams,
                }
            }]
        };

        if (event.userId) payload.user_id = event.userId;
        if (Object.keys(userDataPayload).length > 0) {
            payload.user_data = userDataPayload;
        }

        const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("[GA4-MP] Error sending event to GA4:", errText);
            return { success: false, error: errText };
        }

        console.log(`[GA4-MP] Event ${event.eventName} sent successfully for property ${measurementId}.`);
        return { success: true };

    } catch (error: any) {
        console.error("[GA4-MP] Exception sending event:", error);
        return { success: false, error: error.message };
    }
}
