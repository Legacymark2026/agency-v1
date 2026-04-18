import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        console.log('[Resend Webhook] Received:', payload.type);

        const { type, data } = payload;
        const emailId = data?.email_id; // Resend's internal ID
        const toEmail = data?.to?.[0];

        // We need to find the EmailBlastRecipient by email and sent date/status.
        // It's better if we passed the recipientId in Resend headers, 
        // but Since Resend webhooks might not echo custom headers easily in data payload,
        // we can look up by email and status='SENT' ordered by most recent.
        
        if (!toEmail) return NextResponse.json({ success: true });

        const recipient = await prisma.emailBlastRecipient.findFirst({
            where: { email: toEmail, status: 'SENT' },
            orderBy: { sentAt: 'desc' }
        });

        if (!recipient) {
            console.log(`[Resend Webhook] No recent SENT recipient found for ${toEmail}`);
            return NextResponse.json({ success: true });
        }

        const now = new Date();

        switch (payload.type) {
            case 'email.opened':
                if (!recipient.openedAt) {
                    await prisma.emailBlastRecipient.update({
                        where: { id: recipient.id },
                        data: { openedAt: now }
                    });
                }
                break;
            case 'email.clicked':
                await prisma.emailBlastRecipient.update({
                    where: { id: recipient.id },
                    data: { clickedAt: now }
                });
                break;
            case 'email.bounced':
                await prisma.emailBlastRecipient.update({
                    where: { id: recipient.id },
                    data: { bouncedAt: now, status: 'FAILED', errorMessage: 'Bounced' }
                });
                // Add to suppression list
                const blast = await prisma.emailBlast.findUnique({ where: { id: recipient.blastId } });
                if (blast) {
                    await prisma.suppressionList.upsert({
                        where: { companyId_email: { companyId: blast.companyId, email: toEmail } },
                        create: { companyId: blast.companyId, email: toEmail, reason: 'BOUNCED' },
                        update: {}
                    });
                }
                break;
            case 'email.complained':
                await prisma.emailBlastRecipient.update({
                    where: { id: recipient.id },
                    data: { complainedAt: now }
                });
                // Add to suppression list
                const blastComplained = await prisma.emailBlast.findUnique({ where: { id: recipient.blastId } });
                if (blastComplained) {
                    await prisma.suppressionList.upsert({
                        where: { companyId_email: { companyId: blastComplained.companyId, email: toEmail } },
                        create: { companyId: blastComplained.companyId, email: toEmail, reason: 'COMPLAINED' },
                        update: {}
                    });
                }
                break;
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Resend Webhook] Error:', err.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
