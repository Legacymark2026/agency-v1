import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Fallback for dev without key

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    pdfAttachmentUrl?: string;
    from?: string;
    companyId?: string;
}

export async function sendEmail({ to, subject, html, pdfAttachmentUrl, from, companyId }: SendEmailParams) {
    let apiKey = process.env.RESEND_API_KEY;
    
    // Attempt to fetch dynamic API key from company integrations
    if (companyId) {
        try {
            const { prisma } = await import("@/lib/prisma");
            const integration = await prisma.integrationConfig.findFirst({
                where: { companyId, provider: "RESEND", isEnabled: true }
            });
            if (integration && integration.config && typeof integration.config === "object") {
                const config = integration.config as { apiKey?: string };
                if (config.apiKey) {
                    apiKey = config.apiKey;
                }
            }
        } catch (e) {
            console.error("Error fetching Resend integration config:", e);
        }
    }
    if (!apiKey || apiKey === 're_123456789') {
        console.warn("⚠️ RESEND_API_KEY missing or dummy. Mocking email send:");
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Attachment: ${pdfAttachmentUrl || 'None'}`);
        if (process.env.NODE_ENV === 'production') {
            console.error("❌ CRITICAL: Emails will NOT work in production without a valid RESEND_API_KEY.");
        }
        return { success: true, id: 'mock-id' };
    }

    try {
        const dynamicResend = new Resend(apiKey);
        const canonicalEmail = process.env.ADMIN_CANONICAL_EMAIL || "no-reply@legacymarksas.com";
        const payload: any = {
            from: from || `LegacyMark <${canonicalEmail}>`,
            to: [to],
            subject: subject,
            html: html,
        };

        if (pdfAttachmentUrl && pdfAttachmentUrl.trim() !== '') {
            payload.attachments = [
                {
                    filename: 'documento_adjunto.pdf',
                    path: pdfAttachmentUrl
                }
            ];
        }

        const data = await dynamicResend.emails.send(payload);
        return { success: true, id: data.data?.id };
    } catch (error) {
        console.error("Email Error:", error);
        return { success: false, error };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function replaceVariables(template: string, variables: any) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        return variables[key] || `{{${key}}}`;
    });
}
