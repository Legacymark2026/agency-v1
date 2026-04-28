import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addWeeks } from 'date-fns';

export async function GET(req: Request) {
    try {
        // Verificar Authentication / API Key del Cron si es necesario
        // En un entorno Vercel de producción se verifica la cabecera
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const now = new Date();

        // Only publish posts that are explicitly APPROVED (or don't require approval)
        // NEVER publish PENDING posts automatically — governance must be respected
        const postsToPublish = await prisma.socialPost.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledAt: { lte: now },
                approvalStatus: 'APPROVED',  // ← strict: APPROVED only
            },
            take: 50,
        });

        // Separately warn about expired PENDING posts (notify author)
        const expiredPending = await prisma.socialPost.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledAt: { lte: now },
                approvalStatus: 'PENDING',
            },
            select: { id: true, authorId: true, companyId: true, content: true, scheduledAt: true },
        });

        for (const post of expiredPending) {
            // Create an in-app notification so the author knows approval is needed
            await prisma.notification.create({
                data: {
                    userId: post.authorId,
                    companyId: post.companyId,
                    title: '⚠️ Post vencido esperando aprobación',
                    message: `Un post programado para ${post.scheduledAt?.toLocaleDateString('es-CO')} aún no ha sido aprobado y no fue publicado.`,
                    type: 'SOCIAL_POST_PENDING_EXPIRED',
                },
            }).catch(() => {}); // non-fatal
        }

        if (postsToPublish.length === 0) {
            return NextResponse.json({ success: true, message: 'No posts to publish.' });
        }

        let publishedCount = 0;
        let evergreenRecycledCount = 0;

        // 2. Procesar cada post
        for (const post of postsToPublish) {
            // A. Aquí iría la llamada real a las APIs (Meta, LinkedIn, TikTok) 
            // usando post.content, post.mediaUrls, post.platforms
            // ... API call simulada ...
            console.log(`Publishing post ${post.id} to platforms: ${(post.platforms as string[])?.join(', ')}`);

            // B. Marcar como publicado
            await prisma.socialPost.update({
                where: { id: post.id },
                data: {
                    status: 'PUBLISHED',
                    publishedAt: now,
                }
            });

            // Log de auditoría
            await prisma.socialPostLog.create({
                data: {
                    postId: post.id,
                    userId: post.authorId,
                    action: 'API_PUBLISHED_AUTO',
                    details: { platforms: post.platforms }
                }
            });

            publishedCount++;

            // C. Lógica de Reciclaje Evergreen
            if (post.isEvergreen) {
                // Clonar el post para dentro de 4 semanas
                const newScheduledDate = addWeeks(now, 4);
                
                // Generamos un nuevo contenido ligeramente variado o lo dejamos igual (en este caso lo dejamos igual)
                await prisma.socialPost.create({
                     data: {
                        companyId: post.companyId,
                        authorId: post.authorId,
                        content: post.content,
                        mediaUrls: post.mediaUrls ? (post.mediaUrls as any) : [],
                        platforms: post.platforms ? (post.platforms as any) : [],
                        scheduledAt: newScheduledDate,
                        status: 'SCHEDULED',
                        approvalStatus: post.approvalStatus,
                        internalNotes: `[Evergreen Recycle] Clonado automáticamente desde ${post.id}`,
                        isEvergreen: true, // Se mantiene activo
                        timezone: post.timezone,
                        targetUrl: post.targetUrl,
                        tiktokAudioId: post.tiktokAudioId,
                        firstComment: post.firstComment,
                        utmCampaign: post.utmCampaign,
                        utmSource: post.utmSource,
                        utmMedium: `${post.utmMedium}_evergreen`
                     }
                });

                evergreenRecycledCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            published: publishedCount,
            recycled: evergreenRecycledCount,
            message: `Processed ${publishedCount} posts.` 
        });

    } catch (error) {
        console.error('Error in Social Publisher Cron:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
