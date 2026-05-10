import { prisma } from "@/lib/prisma";

export async function syncHubSpotContacts(companyId: string) {
    try {
        console.log(`[HubSpot Sync] Starting for company ${companyId}`);
        // 1. Get the access token
        const config = await prisma.integrationConfig.findUnique({
            where: { companyId_provider: { companyId, provider: "hubspot" } }
        });

        if (!config || !config.config || !(config.config as any).accessToken) {
            console.error("[HubSpot Sync] Missing access token");
            return { success: false, error: "Missing access token" };
        }

        const accessToken = (config.config as any).accessToken;

        // 2. Fetch contacts from real HubSpot API
        const response = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=email,firstname,lastname,phone", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("[HubSpot Sync] API Error:", data);
            return { success: false, error: data.message };
        }

        const contacts = data.results || [];
        console.log(`[HubSpot Sync] Found ${contacts.length} contacts. Saving to DB...`);

        // 3. Map to LegacyMark Leads and save
        let syncedCount = 0;
        for (const contact of contacts) {
            const props = contact.properties;
            if (!props.email) continue; // Skip contacts without email

            await prisma.lead.upsert({
                where: { 
                    companyId_email: { 
                        companyId, 
                        email: props.email 
                    } 
                },
                update: {
                    name: `${props.firstname || ''} ${props.lastname || ''}`.trim(),
                    phone: props.phone || null,
                    status: "NEW", // Or whatever mapped status
                    source: "hubspot"
                },
                create: {
                    companyId,
                    email: props.email,
                    name: `${props.firstname || ''} ${props.lastname || ''}`.trim(),
                    phone: props.phone || null,
                    status: "NEW",
                    source: "hubspot"
                }
            });
            syncedCount++;
        }

        console.log(`[HubSpot Sync] Successfully synced ${syncedCount} contacts.`);
        return { success: true, count: syncedCount };

    } catch (error: any) {
        console.error("[HubSpot Sync] Internal error:", error);
        return { success: false, error: error.message };
    }
}
