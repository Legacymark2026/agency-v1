import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Fallback for dev without key

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
    if (!process.env.RESEND_API_KEY) {
        console.log("⚠️ RESEND_API_KEY not found. Mocking email send:");
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${html}`);
        return { success: true, id: 'mock-id' };
    }

    try {
        const data = await resend.emails.send({
            from: 'LegacyMark <onboarding@resend.dev>', // Update this with verified domain later
            to: [to],
            subject: subject,
            html: html,
        });
        return { success: true, id: data.data?.id };
    } catch (error) {
        console.error("Email Error:", error);
        return { success: false, error };
    }
}

export function replaceVariables(template: string, variables: any) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        return variables[key] || `{{${key}}}`;
    });
}
