type GTagEvent = {
    action: string;
    category: string;
    label: string;
    value?: number;
};

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('config', GA_TRACKING_ID, {
            page_path: url,
        });
    }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: GTagEvent) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    } else {
        console.warn('[Analytics] gtag not initialized', { action, category, label });
    }
};

export const verifyIntegration = () => {
    if (typeof window === 'undefined') return { ga4: false, pixel: false, hotjar: false };

    return {
        ga4: !!(window as any).dataLayer,
        pixel: !!(window as any).fbq,
        hotjar: !!(window as any).hj
    };
};
