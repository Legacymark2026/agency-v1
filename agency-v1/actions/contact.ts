"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createLead, CreateLeadInput } from "./leads";
import { triggerWorkflow } from "./automation";

export async function submitContactForm(data: {
    // Standard CRM Fields
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message?: string;

    // Dynamic / Custom Fields for Funnels
    formData?: Record<string, any>;
    formId?: string;
    campaignCode?: string;

    // Tracking
    visitorId?: string;
    landingPage?: string;
    referer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    ipAddress?: string;
    userAgent?: string;
}) {
    try {
        // 1. Get Default Company
        const company = await prisma.company.findFirst();
        if (!company) throw new Error("No default company found");
        const companyId = company.id;

        // Flatten formData into a readable message if message is not provided
        let messageContent = data.message || "";
        if (!messageContent && data.formData) {
            messageContent = Object.entries(data.formData)
                .map(([key, val]) => `[${key}]: ${val}`)
                .join("\n");
        }

        const leadInput: CreateLeadInput = {
            companyId,
            email: data.email,
            name: data.name,
            phone: data.phone,
            company: data.company,
            message: messageContent,

            landingPage: data.landingPage,
            referer: data.referer,
            utmSource: data.utmSource,
            utmMedium: data.utmMedium,
            utmCampaign: data.utmCampaign,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            formId: data.formId,
            campaignCode: data.campaignCode,
            formData: data.formData,
        };

        const leadResult = await createLead(leadInput);
        if (!leadResult.success || !leadResult.data) {
            throw new Error(leadResult.error || "Failed to create lead");
        }

        const leadId = leadResult.data.id;

        // 3. Centralized Inbox Creation (WEB_FORM channel)
        const conversation = await prisma.conversation.create({
            data: {
                channel: "WEB_FORM",
                platformId: data.email, // using email as platformId for forms
                status: "OPEN",
                priority: "MEDIUM",
                unreadCount: 1,
                leadId: leadId,
                companyId: companyId,
                messages: {
                    create: {
                        content: messageContent,
                        direction: "INBOUND",
                        status: "SENT",
                        type: "TEXT"
                    }
                }
            }
        });

        // 4. Trigger Automations
        await triggerWorkflow('FORM_SUBMISSION', {
            ...data,
            message: messageContent,
            dealId: leadId // Using leadId here as fallback for dealId in some workflows
        });

        // 5. Revalidate Paths
        try {
            revalidatePath("/dashboard/inbox");
            revalidatePath("/dashboard/admin/crm/leads");
        } catch (e) {
            // ignore
        }

        return { success: true, conversationId: conversation.id };

    } catch (error: any) {
        console.error("Error submitting contact form:", error);
        return { success: false, error: error.message };
    }
}
