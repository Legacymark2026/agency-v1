'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// ============================================
// TYPES
// ============================================

interface AnalyticsContextType {
    visitorId: string;
    sessionId: string;
    trackEvent: (eventName: string, data?: Record<string, any>) => void;
    trackPageView: (path?: string, title?: string) => void;
}

interface UTMParams {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
}

// ============================================
// UTILITIES
// ============================================

// Generate UUID v4
function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Get or create visitor ID (persistent across sessions)
function getVisitorId(): string {
    if (typeof window === 'undefined') return generateId();

    let visitorId = localStorage.getItem('_lm_visitor_id');
    if (!visitorId) {
        visitorId = generateId();
        localStorage.setItem('_lm_visitor_id', visitorId);
    }
    return visitorId;
}

// Create session ID (new per browser session)
function getSessionId(): string {
    if (typeof window === 'undefined') return generateId();

    let sessionId = sessionStorage.getItem('_lm_session_id');
    if (!sessionId) {
        sessionId = generateId();
        sessionStorage.setItem('_lm_session_id', sessionId);
    }
    return sessionId;
}

// Extract UTM params from URL
function getUTMParams(searchParams: URLSearchParams): UTMParams {
    return {
        utmSource: searchParams.get('utm_source') || undefined,
        utmMedium: searchParams.get('utm_medium') || undefined,
        utmCampaign: searchParams.get('utm_campaign') || undefined,
        utmTerm: searchParams.get('utm_term') || undefined,
        utmContent: searchParams.get('utm_content') || undefined,
    };
}

// ============================================
// CONTEXT
// ============================================

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function useAnalytics() {
    const context = useContext(AnalyticsContext);
    if (!context) {
        throw new Error('useAnalytics must be used within AnalyticsProvider');
    }
    return context;
}

// ============================================
// PROVIDER
// ============================================

interface AnalyticsProviderProps {
    children: React.ReactNode;
    userId?: string;
    enabled?: boolean;
}

export function AnalyticsProvider({ children, userId, enabled = true }: AnalyticsProviderProps) {
    const [visitorId, setVisitorId] = useState('');
    const [sessionId, setSessionId] = useState('');
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize IDs on client mount
    useEffect(() => {
        setVisitorId(getVisitorId());
        setSessionId(getSessionId());
    }, []);

    // Refs for tracking
    const pageStartTime = useRef<number>(Date.now());
    const currentEventId = useRef<string | null>(null);
    const scrollDepth = useRef<number>(0);
    const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
    const lastPathname = useRef<string>('');

    // UTM params (captured on first pageview)
    const utmParams = useRef<UTMParams>({});

    useEffect(() => {
        utmParams.current = getUTMParams(searchParams);
    }, [searchParams]);

    // Track scroll depth
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY;
            const depth = scrollHeight > 0 ? Math.round((currentScroll / scrollHeight) * 100) : 0;
            scrollDepth.current = Math.max(scrollDepth.current, depth);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [enabled]);

    // Forward event to GA4 (gtag) if available
    const forwardToGa4 = useCallback((eventType: string, eventName?: string, data?: Record<string, any>) => {
        if (typeof window === 'undefined' || !(window as any).gtag) return;
        const gtag = (window as any).gtag;

        if (eventType === 'PAGE_VIEW') {
            gtag('event', 'page_view', { page_path: pathname, page_title: document.title });
        } else if (eventName === 'GENERATE_LEAD') {
            gtag('event', 'generate_lead', {
                source: data?.source || 'unknown',
                ...(data?.company ? { company: data.company } : {}),
            });
        } else if (eventName === 'PURCHASE') {
            gtag('event', 'purchase', data);
        } else if (eventName === 'SIGN_UP') {
            gtag('event', 'sign_up', { method: data?.method || 'form' });
        } else if (eventName === 'BEGIN_CHECKOUT') {
            gtag('event', 'begin_checkout', data);
        } else if (eventName) {
            // Forward other custom events with their original name (snake_case)
            gtag('event', eventName.toLowerCase(), data);
        }
    }, [pathname]);

    // Send tracking data
    const sendTrackingData = useCallback(async (
        eventType: string,
        eventName?: string,
        data?: Record<string, any>
    ) => {
        if (!enabled) return;

        // Forward to GA4 in parallel (non-blocking)
        forwardToGa4(eventType, eventName, data);

        try {
            const response = await fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType,
                    eventName,
                    eventValue: data?.value,
                    path: pathname,
                    title: document.title,
                    referrer: document.referrer,
                    sessionId,
                    visitorId,
                    userId,
                    screenRes: `${window.screen.width}x${window.screen.height}`,
                    loadTime: (performance.timing?.loadEventEnd > 0) ? (performance.timing.loadEventEnd - performance.timing.navigationStart) : 0,
                    domReady: (performance.timing?.domContentLoadedEventEnd > 0) ? (performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart) : 0,
                    metadata: data,
                    ...utmParams.current,
                }),
            });

            const result = await response.json();
            if (result.eventId) {
                currentEventId.current = result.eventId;
            }
        } catch (error) {
            console.error('Analytics track failed:', error);
        }
    }, [enabled, pathname, sessionId, visitorId, userId, forwardToGa4]);

    // Track page view
    const trackPageView = useCallback((path?: string, title?: string) => {
        sendTrackingData('PAGE_VIEW', undefined, { path, title });
        pageStartTime.current = Date.now();
        scrollDepth.current = 0;
    }, [sendTrackingData]);

    // Track custom event
    const trackEvent = useCallback((eventName: string, data?: Record<string, any>) => {
        sendTrackingData('CUSTOM', eventName, data);
    }, [sendTrackingData]);

    // Send heartbeat
    const sendHeartbeat = useCallback(async () => {
        if (!enabled) return;

        const duration = Math.round((Date.now() - pageStartTime.current) / 1000);

        try {
            await fetch('/api/analytics/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    duration,
                    scrollDepth: scrollDepth.current,
                    eventId: currentEventId.current,
                }),
            });
        } catch (error) {
            // Silent fail for heartbeats
        }
    }, [enabled, sessionId]);

    // Track page views on route change
    useEffect(() => {
        if (!enabled) return;

        // Don't track duplicate pageviews
        if (lastPathname.current === pathname) return;
        lastPathname.current = pathname;

        trackPageView();

        // Start heartbeat
        if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
        }
        heartbeatInterval.current = setInterval(sendHeartbeat, 10000); // Every 10 seconds

        return () => {
            if (heartbeatInterval.current) {
                clearInterval(heartbeatInterval.current);
            }
        };
    }, [pathname, enabled, trackPageView, sendHeartbeat]);

    // End session on page unload
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        const handleUnload = () => {
            // Use sendBeacon for reliable delivery on page close
            navigator.sendBeacon('/api/analytics/end-session', JSON.stringify({ sessionId }));
        };

        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, [enabled, sessionId]);

    return (
        <AnalyticsContext.Provider value={{ visitorId, sessionId, trackEvent, trackPageView }}>
            {children}
        </AnalyticsContext.Provider>
    );
}
