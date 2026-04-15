'use server';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getDripCampaigns(companyId: string) {
    return await db.campaign.findMany({
        where: {
            companyId,
            platform: 'EMAIL'
        },
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { leads: true }
            }
        }
    });
}

export async function createDripCampaign(data: {
    name: string;
    description?: string;
    companyId: string;
}) {
    try {
        // Create the Campaign container
        const campaign = await db.campaign.create({
            data: {
                name: data.name,
                code: `EMAIL-DRIP-${Date.now()}`,
                platform: 'EMAIL',
                status: 'DRAFT',
                description: data.description,
                companyId: data.companyId
            }
        });

        // Create a paired Workflow for the automation logic
        await db.workflow.create({
            data: {
                name: `[Workflow] ${data.name}`,
                description: `Automation for Drip Campaign: ${data.name}`,
                isActive: false,
                triggerType: 'CAMPAIGN_ENROLLMENT',
                triggerConfig: { campaignId: campaign.id },
                steps: [
                    { type: 'EMAIL', subject: 'Welcome!', content: 'Hello...', delay: 0 },
                    { type: 'WAIT', duration: '2d' },
                    { type: 'EMAIL', subject: 'Following up', content: 'Did you see...', delay: 0 }
                ],
                companyId: data.companyId
            }
        });

        revalidatePath("/dashboard/marketing/campaigns");
        return { success: true, data: campaign };
    } catch (error) {
        console.error("Error creating drip campaign:", error);
        return { success: false, error: "Failed to create campaign" };
    }
}

export async function toggleCampaignStatus(campaignId: string, status: string) {
    try {
        await db.campaign.update({
            where: { id: campaignId },
            data: { status }
        });
        revalidatePath("/dashboard/marketing/campaigns");
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { success: false, error: "Failed to update status" };
    }
}
