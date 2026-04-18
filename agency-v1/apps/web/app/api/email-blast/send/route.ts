import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

// Dynamic getter — fetches from DB if available, fallback to env
async function getResend(companyId: string) {
    let key = process.env.RESEND_API_KEY;
    try {
        const integration = await prisma.integrationConfig.findFirst({
            where: { companyId, provider: "RESEND", isEnabled: true }
        });
        if (integration && integration.config && typeof integration.config === "object") {
            const config = integration.config as { apiKey?: string };
            if (config.apiKey) key = config.apiKey;
        }
    } catch(e) {
        console.error("Error fetching Resend config from DB:", e);
    }

    if (!key) throw new Error('RESEND_API_KEY no detectada. Por favor guárdala en Ajustes > Integraciones.');
    return new Resend(key);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { blastId } = await req.json();
    if (!blastId) return NextResponse.json({ error: 'blastId requerido' }, { status: 400 });

    // Find the blast
    const blast = await prisma.emailBlast.findUnique({
        where: { id: blastId },
        include: { recipients: { where: { status: 'PENDING' } } },
    });

    if (!blast) return NextResponse.json({ error: 'Blast no encontrado' }, { status: 404 });

    // Create a server-sent event stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                await prisma.emailBlast.update({
                    where: { id: blastId },
                    data: { status: 'SENDING' },
                });

                const CHUNK_SIZE = 50;
                const recipients = blast.recipients;
                let totalSent = 0;
                let totalFailed = 0;

                send({ type: 'start', total: recipients.length });

                for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
                    const chunk = recipients.slice(i, i + CHUNK_SIZE);

                    const resend = await getResend(blast.companyId);
                    const results = await Promise.allSettled(
                        chunk.map((r) => {
                            const vars = (r.variables as Record<string, string>) ?? {};
                            const html = blast.htmlBody.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => vars[k] ?? r.name ?? '');
                            return resend.emails.send({
                                from: `${blast.fromName} <${blast.fromEmail}>`,
                                to: r.email,
                                subject: blast.subject,
                                html,
                            });
                        })
                    );

                    for (let j = 0; j < results.length; j++) {
                        const result = results[j];
                        const recipient = chunk[j];

                        if (result.status === 'fulfilled' && result.value.data?.id) {
                            await prisma.emailBlastRecipient.update({
                                where: { id: recipient.id },
                                data: { status: 'SENT', sentAt: new Date() },
                            });
                            totalSent++;
                            send({ type: 'progress', sent: totalSent, failed: totalFailed, total: recipients.length, email: recipient.email });
                        } else {
                            const errMsg = result.status === 'rejected' ? String(result.reason) : (result.value?.error?.message || 'Error Desconocido');
                            await prisma.emailBlastRecipient.update({
                                where: { id: recipient.id },
                                data: { status: 'FAILED', errorMessage: errMsg },
                            });
                            totalFailed++;
                            send({ type: 'progress', sent: totalSent, failed: totalFailed, total: recipients.length, email: recipient.email, error: errMsg });
                        }
                    }

                    await new Promise((r) => setTimeout(r, 300));
                }

                await prisma.emailBlast.update({
                    where: { id: blastId },
                    data: {
                        status: totalFailed === recipients.length ? 'FAILED' : 'COMPLETED',
                        sent: totalSent,
                        failed: totalFailed,
                        sentAt: new Date(),
                    },
                });

                send({ type: 'done', sent: totalSent, failed: totalFailed, total: recipients.length });
            } catch (error: any) {
                console.error("[Email Blast SSE Error]", error);
                send({ type: 'error', error: error.message || "Error interno del servidor" });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
