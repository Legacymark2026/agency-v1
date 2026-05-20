import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const emptyOverview = {
    visitors: 0,
    sessions: 0,
    pageViews: 0,
    avgDuration: 0,
    bounceRate: 0,
    pagesPerSession: 0,
    conversions: 0,
    conversionRate: 0,
    trends: { visitors: 0, sessions: 0, bounceRate: 0, conversions: 0 },
};

async function getAnalyticsOverviewRaw(days: number = 30) {
    try {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

        console.log("Fetching prisma queries...");
        const [currentSessions, prevSessions, currentEvents, prevEvents] = await Promise.all([
            (prisma as any).analyticsSession.findMany({
                where: { startedAt: { gte: startDate } },
                select: {
                    id: true,
                    visitorId: true,
                    duration: true,
                    pageViews: true,
                    isBounce: true,
                    converted: true,
                },
            }),
            (prisma as any).analyticsSession.findMany({
                where: { startedAt: { gte: prevStartDate, lt: startDate } },
                select: {
                    id: true,
                    visitorId: true,
                    isBounce: true,
                    converted: true,
                },
            }),
            (prisma as any).analyticsEvent.count({
                where: { createdAt: { gte: startDate }, eventType: 'PAGE_VIEW' },
            }),
            (prisma as any).analyticsEvent.count({
                where: { createdAt: { gte: prevStartDate, lt: startDate }, eventType: 'PAGE_VIEW' },
            }),
        ]);

        console.log("Current sessions count:", currentSessions.length);
        console.log("Prev sessions count:", prevSessions.length);
        console.log("Current events count:", currentEvents);

        // Calculate current metrics
        const visitors = new Set(currentSessions.map((s: any) => s.visitorId)).size;
        const sessions = currentSessions.length;
        const pageViews = currentEvents;
        const totalDuration = currentSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
        const avgDuration = sessions > 0 ? totalDuration / sessions : 0;
        const bounces = currentSessions.filter((s: any) => s.isBounce).length;
        const bounceRate = sessions > 0 ? (bounces / sessions) * 100 : 0;
        const pagesPerSession = sessions > 0 ? pageViews / sessions : 0;
        const conversions = currentSessions.filter((s: any) => s.converted).length;
        const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0;

        // Calculate previous metrics for trends
        const prevVisitors = new Set(prevSessions.map((s: any) => s.visitorId)).size;
        const prevSessionCount = prevSessions.length;
        const prevBounces = prevSessions.filter((s: any) => s.isBounce).length;
        const prevBounceRate = prevSessionCount > 0 ? (prevBounces / prevSessionCount) * 100 : 0;
        const prevConversions = prevSessions.filter((s: any) => s.converted).length;

        // Calculate percentage changes
        const calcTrend = (current: number, prev: number) =>
            prev > 0 ? ((current - prev) / prev) * 100 : current > 0 ? 100 : 0;

        const result = {
            visitors,
            sessions,
            pageViews,
            avgDuration: Math.round(avgDuration),
            bounceRate: Math.round(bounceRate * 10) / 10,
            pagesPerSession: Math.round(pagesPerSession * 10) / 10,
            conversions,
            conversionRate: Math.round(conversionRate * 10) / 10,
            trends: {
                visitors: Math.round(calcTrend(visitors, prevVisitors)),
                sessions: Math.round(calcTrend(sessions, prevSessionCount)),
                bounceRate: Math.round(calcTrend(bounceRate, prevBounceRate)),
                conversions: Math.round(calcTrend(conversions, prevConversions)),
            },
        };

        console.log("Calculated Result:", JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error("Failed to run getAnalyticsOverviewRaw:", error.message || error);
    } finally {
        await prisma.$disconnect();
    }
}

getAnalyticsOverviewRaw();
