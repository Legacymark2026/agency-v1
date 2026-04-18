'use server';

import { createLead } from "@/actions/leads";
import { prisma } from "@/lib/prisma";

interface VIPSubmission {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    note?: string;
}

export async function submitVIPLead(data: VIPSubmission) {
    try {
        // 1. Get Default Company (The Agency)
        // In a single-tenant app this is easy. In multi-tenant, we might need a specific ID.
        // For now, we take the first company or a specific one if defined in env.
        const company = await prisma.company.findFirst();

        if (!company) {
            return { success: false, error: "Configuration Error: No company found." };
        }

        // 2. Ensure Campaign "VIP-CARD" exists to track these specifically
        let campaign = await prisma.campaign.findFirst({
            where: { code: 'VIP-CARD', companyId: company.id }
        });

        if (!campaign) {
            campaign = await prisma.campaign.create({
                data: {
                    name: "VIP Physical Cards",
                    code: "VIP-CARD",
                    companyId: company.id,
                    platform: "Offline",
                    status: "ACTIVE",
                    description: "Leads gathered from physical business cards",
                    startDate: new Date()
                }
            });
        }

        // 3. Create Lead via existing action
        const result = await createLead({
            companyId: company.id,
            email: data.email,
            name: data.name,
            phone: data.phone,
            company: data.company,
            message: data.note,

            // Critical Tracking Info
            utmSource: 'physical_card',
            utmMedium: 'qr_scan',
            utmCampaign: 'VIP-CARD',
            campaignCode: 'VIP-CARD',

            tags: ['VIP', 'Card Scan']
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        // 4. Send Notifications (Professional Async Handling)
        try {
            const { sendEmail } = await import('@/lib/email');
            const { VIPWelcomeTemplate, AdminAlertTemplate } = await import('@/lib/email-templates');

            // Admin Alert
            await sendEmail({
                to: 'admin@legacymark.com', // Replace with dynamic admin email if available
                subject: `🚀 Nuevo Lead VIP: ${data.name}`,
                html: AdminAlertTemplate(
                    data.name,
                    data.email,
                    data.phone || '',
                    data.company || '',
                    data.note || ''
                )
            });

            // Lead Welcome
            await sendEmail({
                to: data.email,
                subject: 'Acceso VIP Confirmado | LegacyMark',
                html: VIPWelcomeTemplate(data.name)
            });

        } catch (emailError) {
            // Non-blocking error - we still return success for the lead creation
            console.error("Failed to send VIP emails:", emailError);
        }

        return { success: true, leadId: result.data?.id };

    } catch (error) {
        console.error("VIP Submission Error:", error);
        return { success: false, error: "Unable to process VIP request. Please try again." };
    }
}
