import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// Device detection from User-Agent
function parseUserAgent(ua: string): { device: string; browser: string; browserVer: string; os: string; osVersion: string } {
    const result = { device: 'desktop', browser: 'Unknown', browserVer: '', os: 'Unknown', osVersion: '' };

    // Device detection
    if (/Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        result.device = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
    }

    // Browser detection
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
        result.browser = 'Chrome';
        const match = ua.match(/Chrome\/(\d+)/);
        result.browserVer = match ? match[1] : '';
    } else if (ua.includes('Firefox')) {
        result.browser = 'Firefox';
        const match = ua.match(/Firefox\/(\d+)/);
        result.browserVer = match ? match[1] : '';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        result.browser = 'Safari';
        const match = ua.match(/Version\/(\d+)/);
        result.browserVer = match ? match[1] : '';
    } else if (ua.includes('Edg')) {
        result.browser = 'Edge';
        const match = ua.match(/Edg\/(\d+)/);
        result.browserVer = match ? match[1] : '';
    }

    // OS detection
    if (ua.includes('Windows')) {
        result.os = 'Windows';
        if (ua.includes('Windows NT 10.0')) result.osVersion = '10';
        else if (ua.includes('Windows NT 11.0')) result.osVersion = '11';
    } else if (ua.includes('Mac OS')) {
        result.os = 'macOS';
    } else if (ua.includes('Android')) {
        result.os = 'Android';
        const match = ua.match(/Android (\d+)/);
        result.osVersion = match ? match[1] : '';
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
        result.os = 'iOS';
    } else if (ua.includes('Linux')) {
        result.os = 'Linux';
    }

    return result;
}

// Simple geo lookup (using free IP API - can be replaced with MaxMind in production)
async function getGeoFromIP(ip: string): Promise<{ country: string; countryCode: string; region: string; city: string; timezone: string }> {
    const defaultGeo = { country: 'Unknown', countryCode: 'XX', region: '', city: '', timezone: '' };

    if (!ip || ip === '127.0.0.1' || ip === '::1') {
        return defaultGeo;
    }

    try {
        // Using ip-api.com free tier (45 req/min limit)
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,regionName,city,timezone`, {
            next: { revalidate: 86400 }, // Cache for 24 hours
        });

        if (response.ok) {
            const data = await response.json();
            return {
                country: data.country || 'Unknown',
                countryCode: data.countryCode || 'XX',
                region: data.regionName || '',
                city: data.city || '',
                timezone: data.timezone || '',
            };
        }
    } catch (error) {
        console.error('Geo lookup failed:', error);
    }

    return defaultGeo;
}

// Rate limiting (simple in-memory, use Redis in production)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const limit = rateLimits.get(ip);

    if (!limit || now > limit.resetAt) {
        rateLimits.set(ip, { count: 1, resetAt: now + 60000 }); // 1 minute window
        return true;
    }

    if (limit.count >= 100) { // 100 requests per minute max
        return false;
    }

    limit.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        // Get client IP
        const headersList = await headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor?.split(',')[0].trim() ||
            headersList.get('x-real-ip') ||
            '127.0.0.1';

        // Rate limiting
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429 }
            );
        }

        // Parse request body
        const body = await request.json();
        const {
            eventType,
            eventName,
            // eventValue, // Removed: Field does not exist in schema
            path,
            title,
            referrer,
            sessionId,
            visitorId,
            userId,
            screenRes,
            loadTime,
            domReady,
            scrollDepth,
            metadata,
            utmSource,
            utmMedium,
            utmCampaign,
            utmTerm,
            utmContent,
        } = body;

        // Validate required fields (very lenient - create if missing)
        if (!eventType || !path) {
            console.log('[Analytics Track] ⚠️ Validation FAILED - missing eventType or path. Generating fallback IDs anyway.');
        } else {
            console.log('[Analytics Track] ✅ Basic validation passed');
        }

        // Generate visitorId and sessionId if not provided or empty
        const effectiveVisitorId = (!visitorId || !visitorId.trim()) 
            ? `visitor-${Date.now()}-${Math.random().toString(36).substring(7)}`
            : visitorId.trim();
        
        const effectiveSessionId = (!sessionId || !sessionId.trim())
            ? `session-${Date.now()}-${Math.random().toString(36).substring(7)}`
            : sessionId.trim();

        console.log('[Analytics Track] Using visitorId:', effectiveVisitorId, 'sessionId:', effectiveSessionId);

        // Get User-Agent info
        const userAgent = headersList.get('user-agent') || '';
        const { device, browser, browserVer, os, osVersion } = parseUserAgent(userAgent);

        // Get geo info
        const geo = await getGeoFromIP(ip);

        // Find existing session by visitorId or create new one
        const existingSession = await prisma.analyticsSession.findFirst({
            where: { visitorId: effectiveVisitorId },
            orderBy: { startedAt: 'desc' }
        });

        let currentSessionId = existingSession?.id;

        if (!existingSession) {
            // Create new session
            const newSession = await prisma.analyticsSession.create({
                data: {
                    visitorId: effectiveVisitorId,
                    userId,
                    entryPage: path,
                    referrer,
                    device,
                    browser,
                    os,
                    country: geo.country,
                    countryCode: geo.countryCode,
                    city: geo.city,
                    utmSource,
                    utmMedium,
                    utmCampaign,
                },
            });
            currentSessionId = newSession.id;
        } else {
            // Update existing session
            await prisma.analyticsSession.update({
                where: { id: existingSession.id },
                data: {
                    exitPage: path,
                    isActive: true,
                    pageViews: { increment: 1 },
                    isBounce: false,
                },
            });
            currentSessionId = existingSession.id;
        }

        // Create event
        const event = await prisma.analyticsEvent.create({
            data: {
                eventType,
                eventName,
                path,
                title,
                referrer,
                sessionId: currentSessionId,
                visitorId: effectiveVisitorId,
                userId,
                device,
                browser,
                browserVer,
                os,
                osVersion,
                screenRes,
                country: geo.country,
                countryCode: geo.countryCode,
                region: geo.region,
                city: geo.city,
                timezone: geo.timezone,
                loadTime,
                domReady,
                scrollDepth,
                metadata: metadata || {},
                utmSource,
                utmMedium,
                utmCampaign,
                utmTerm,
                utmContent,
            },
        });

        return NextResponse.json({
            success: true,
            eventId: event.id
        });

    } catch (error) {
        console.error('Analytics tracking error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
