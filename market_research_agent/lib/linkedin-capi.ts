import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface LinkedinEventData {
    conversionInfo: {
        conversionId?: string; // If using specific campaign conversion rules
        currencyCode?: string;
        amount?: number;
    };
    userData: {
        email?: string; // Will be hashed SHA256
        firstName?: string;
        lastName?: string;
    };
}

function hashSha256(str: string): string {
    return crypto.createHash('sha256').update(str.toLowerCase().trim()).digest('hex');
}

export async function sendLinkedinCapiEvent(companyId: string, event: LinkedinEventData) {
    try {
        const configRecord = await prisma.integrationConfig.findUnique({
            where: {
                companyId_provider: {
                    companyId: companyId,
                    provider: 'linkedin-insight'
                }
            }
        });

        if (!configRecord || !configRecord.isEnabled) return null;

        const data = configRecord.config as any;
        const accessToken = data?.linkedinAccessToken;
        const configConversionId = data?.linkedinConversionId;

        // LinkedIn Conversions API requires only the token for auth, but knowing the partner/conversion rule helps
        if (!accessToken) {
            console.warn(`[LinkedIn-CAPI] Missing Access Token for company ${companyId}`);
            return null;
        }

        const userPayload: any = {};
        if (event.userData.email) {
            userPayload.sha256EmailAddress = hashSha256(event.userData.email);
        }
        if (event.userData.firstName) userPayload.firstName = event.userData.firstName;
        if (event.userData.lastName) userPayload.lastName = event.userData.lastName;

        // LinkedIn requires event creation timestamp in milliseconds
        const conversionHappenedAt = Date.now();

        const conversionBaseId = event.conversionInfo.conversionId || configConversionId || "YOUR_CONVERSION_RULE_ID";

        const payload = {
            conversion: `urn:li:sponsorConversion:${conversionBaseId}`,
            conversionHappenedAt: conversionHappenedAt,
            conversionValue: {
                currencyCode: event.conversionInfo.currencyCode || "COP",
                amount: (event.conversionInfo.amount || 0).toString()
            },
            user: {
                userIds: [
                    {
                        idType: "SHA256_EMAIL",
                        idValue: userPayload.sha256EmailAddress
                    }
                ],
                userInfo: {
                    firstName: userPayload.firstName,
                    lastName: userPayload.lastName
                }
            }
        };

        // For LinkedIn CAPI the endpoint is different and highly reliant on the conversion rule ID setup in ad manager
        // This is the V2 standard format.
        const url = `https://api.linkedin.com/rest/conversionEvents`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'LinkedIn-Version': '202312' // Or current version
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("[LinkedIn-CAPI] Error sending event to LinkedIn:", errText);
            return { success: false, error: errText };
        }

        console.log(`[LinkedIn-CAPI] Event sent successfully.`);
        return { success: true };

    } catch (error: any) {
        console.error("[LinkedIn-CAPI] Exception sending event:", error);
        return { success: false, error: error.message };
    }
}
