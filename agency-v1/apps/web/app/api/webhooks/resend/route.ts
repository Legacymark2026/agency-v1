import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        // ── Svix Signature Verification ──────────────────────────────────────
        const secret = process.env.RESEND_WEBHOOK_SECRET;
        if (secret) {
            const signature = request.headers.get("svix-signature");
            const msgId = request.headers.get("svix-id");
            const timestamp = request.headers.get("svix-timestamp");

            if (!signature || !msgId || !timestamp) {
                return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
            }
            try {
                const { Webhook } = await import("svix");
                const rawBody = await request.clone().text();
                new Webhook(secret).verify(rawBody, {
                    "svix-id": msgId,
                    "svix-signature": signature,
                    "svix-timestamp": timestamp,
                });
            } catch {
                return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        const payload = await request.json();
        console.log('[Resend Webhook] Received:', payload.type);

        const { type, data } = payload;
        const toEmail = data?.to?.[0];

        if (!toEmail) return NextResponse.json({ success: true });

        const recipient = await prisma.emailBlastRecipient.findFirst({
            where: { email: toEmail, status: 'SENT' },
            orderBy: { sentAt: 'desc' }
        });

        if (!recipient) {
            console.log(`[Resend Webhook] No recipient found for ${toEmail}`);
            return NextResponse.json({ success: true });
        }

        const now = new Date();

        switch (type) {
            case 'email.opened':
                if (!recipient.openedAt) {
                    await prisma.emailBlastRecipient.update({
                        where: { id: recipient.id },
                        data: { openedAt: now }
                    });
                    await prisma.emailBlast.update({
                        where: { id: recipient.blastId },
                        data: { opens: { increment: 1 } },
                    });
                }
                break;

            case 'email.clicked':
                if (!recipient.clickedAt) {
                    await prisma.emailBlastRecipient.update({
                        where: { id: recipient.id },
                        data: { clickedAt: now }
                    });
                    await prisma.emailBlast.update({
                        where: { id: recipient.blastId },
                        data: { clicks: { increment: 1 } },
                    });
                }
                break;

            case 'email.bounced': {
                await prisma.emailBlastRecipient.update({
                    where: { id: recipient.id },
                    data: { bouncedAt: now, status: 'BOUNCED', errorMessage: 'Hard bounce' }
                });
                const blast = await prisma.emailBlast.findUnique({ where: { id: recipient.blastId } });
                if (blast) {
                    await prisma.suppressionList.upsert({
                        where: { companyId_email: { companyId: blast.companyId, email: toEmail.toLowerCase() } },
                        create: { companyId: blast.companyId, email: toEmail.toLowerCase(), reason: 'BOUNCE' },
                        update: { reason: 'BOUNCE' }
                    });
                }
                break;
            }

            case 'email.complained': {
                await prisma.emailBlastRecipient.update({
                    where: { id: recipient.id },
                    data: { complainedAt: now, status: 'COMPLAINED' }
                });
                const blastC = await prisma.emailBlast.findUnique({ where: { id: recipient.blastId } });
                if (blastC) {
                    await prisma.suppressionList.upsert({
                        where: { companyId_email: { companyId: blastC.companyId, email: toEmail.toLowerCase() } },
                        create: { companyId: blastC.companyId, email: toEmail.toLowerCase(), reason: 'COMPLAINT' },
                        update: { reason: 'COMPLAINT' }
                    });
                }
                break;
            }
        }

        return NextResponse.json({ success: true, type });
    } catch (err: any) {
        console.error('[Resend Webhook] Error:', err.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
