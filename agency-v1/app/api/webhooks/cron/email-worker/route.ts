import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import Handlebars from 'handlebars';

async function getResend(companyId: string) {
    let key = process.env.RESEND_API_KEY;
    try {
        const { prisma } = await import("@/lib/prisma");
        const integration = await prisma.integrationConfig.findFirst({
            where: { companyId, provider: "RESEND", isEnabled: true }
        });
        if (integration && integration.config && typeof integration.config === "object") {
            const config = integration.config as { apiKey?: string };
            if (config.apiKey) key = config.apiKey;
        }
    } catch(e) {}

    return new Resend(key || "dummy_key");
}

export async function POST(request: Request) {
    try {
        // Authenticate the cron request (Vercel sets a header or you can use a CRON_SECRET)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-secret'}` && process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Email Worker] Searching for QUEUED blasts...');

        // Find QUEUED campaigns whose scheduled time has passed
        const blasts = await prisma.emailBlast.findMany({
            where: {
                status: 'QUEUED',
                scheduledAt: { lte: new Date() }
            },
            take: 3 // Process up to 3 campaigns per cron tick
        });

        if (blasts.length === 0) {
            return NextResponse.json({ message: 'No blasts queued.' });
        }

        for (const blast of blasts) {
            console.log(`[Email Worker] Processing blast ${blast.id} (${blast.name})`);
            
            // Mark as SENDING
            await prisma.emailBlast.update({
                where: { id: blast.id },
                data: { status: 'SENDING' }
            });

            // Get pending recipients
            const recipients = await prisma.emailBlastRecipient.findMany({
                where: { blastId: blast.id, status: 'PENDING' },
                take: 100 // Process chunks of 100 per minute per blast
            });

            if (recipients.length === 0) {
                // If no pending, mark completed
                await prisma.emailBlast.update({
                    where: { id: blast.id },
                    data: { status: 'COMPLETED', sentAt: new Date() }
                });
                continue;
            }

            // Get suppression list for this company
            const suppressed = await prisma.suppressionList.findMany({
                where: { companyId: blast.companyId },
                select: { email: true }
            });
            const suppressedEmails = new Set(suppressed.map(s => s.email.toLowerCase()));

            let sentCount = 0;
            let failedCount = 0;

            // Compile template
            const templateHtmlA = Handlebars.compile(blast.htmlBody);
            const templateSubjA = Handlebars.compile(blast.subject);
            
            let templateHtmlB: Handlebars.TemplateDelegate | null = null;
            let templateSubjB: Handlebars.TemplateDelegate | null = null;
            
            if (blast.isAbTest) {
                if (blast.htmlBodyB) templateHtmlB = Handlebars.compile(blast.htmlBodyB);
                if (blast.subjectB) templateSubjB = Handlebars.compile(blast.subjectB);
            }

            for (const r of recipients) {
                const emailLower = r.email.toLowerCase();
                if (suppressedEmails.has(emailLower)) {
                    // Suppressed
                    await prisma.emailBlastRecipient.update({
                        where: { id: r.id },
                        data: { status: 'FAILED', errorMessage: 'Email in suppression list' }
                    });
                    failedCount++;
                    continue;
                }

                // Determine variant A or B
                const isB = blast.isAbTest && r.variant === 'B';
                const htmlTemplate = isB && templateHtmlB ? templateHtmlB : templateHtmlA;
                const subjTemplate = isB && templateSubjB ? templateSubjB : templateSubjA;

                const vars = (r.variables as Record<string, any>) || {};
                const context = { ...vars, name: r.name, email: r.email, unsubscribe_url: `https://legacymarksas.com/unsubscribe?e=${encodeURIComponent(r.email)}` };
                
                let finalHtml = '';
                let finalSubj = '';
                try {
                    finalHtml = htmlTemplate(context);
                    finalSubj = subjTemplate(context);
                } catch(e) {
                    finalHtml = blast.htmlBody; // fallback
                    finalSubj = blast.subject;
                }

                try {
                    const resend = await getResend(blast.companyId);
                    const result = await resend.emails.send({
                        from: `${blast.fromName} <${blast.fromEmail}>`,
                        to: r.email,
                        subject: finalSubj,
                        html: finalHtml,
                    });

                    if (result.data?.id) {
                        await prisma.emailBlastRecipient.update({
                            where: { id: r.id },
                            data: { status: 'SENT', sentAt: new Date() }
                        });
                        sentCount++;
                    } else if (result.error) {
                        await prisma.emailBlastRecipient.update({
                            where: { id: r.id },
                            data: { status: 'FAILED', errorMessage: result.error.message }
                        });
                        failedCount++;
                    }
                } catch (err: any) {
                    await prisma.emailBlastRecipient.update({
                        where: { id: r.id },
                        data: { status: 'FAILED', errorMessage: err.message }
                    });
                    failedCount++;
                }

                // Limit API rate (Resend allows ~2/sec, but this is a background job so we can pause)
                await new Promise(res => setTimeout(res, 500));
            }

            // Update stats
            const updatedBlast = await prisma.emailBlast.update({
                where: { id: blast.id },
                data: { 
                    sent: { increment: sentCount },
                    failed: { increment: failedCount }
                },
                select: { totalRecipients: true, sent: true, failed: true }
            });

            // If all done
            if (updatedBlast.sent + updatedBlast.failed >= updatedBlast.totalRecipients) {
                await prisma.emailBlast.update({
                    where: { id: blast.id },
                    data: { status: 'COMPLETED', sentAt: new Date() }
                });
            } else {
                // Return to QUEUED to process the next chunk next minute
                await prisma.emailBlast.update({
                    where: { id: blast.id },
                    data: { status: 'QUEUED' }
                });
            }
        }

        return NextResponse.json({ success: true, message: `Processed ${blasts.length} campaigns` });
    } catch (err: any) {
        console.error('[Email Worker] Error:', err.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
